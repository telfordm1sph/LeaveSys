<?php

require_once(__DIR__ . '/../config.php'); // Use __DIR__ for absolute path

class AutoUpdate extends DBConnection
{
    private $settings;
    private $masterListConnection; // Add separate connection for masterlist

    public function __construct()
    {
        global $_settings, $MasterListConnection;
        $this->settings = $_settings;
        $this->masterListConnection = $MasterListConnection; // Store masterlist connection
        parent::__construct();
    }

    public function __destruct()
    {
        parent::__destruct();
    }

    function capture_err()
    {
        if (!$this->conn->error) return false;

        return json_encode([
            'status' => 'failed',
            'error' => $this->conn->error
        ]);
    }

    private function insertLeaveHistory($employId, $typeOfLeave, $currBal, $credits, $newBal, $remarks)
    {
        // First, get employee name from masterlist connection
        $empName = 'Unknown Employee';
        if ($this->masterListConnection) {
            $stmt = $this->masterListConnection->prepare("SELECT EMPNAME FROM employee_masterlist WHERE EMPLOYID = ?");
            $stmt->bind_param("i", $employId);
            $stmt->execute();
            $stmt->bind_result($empName);
            if (!$stmt->fetch()) {
                $empName = 'Unknown Employee';
            }
            $stmt->close();
        }

        // Then insert into leave_history using the main connection
        $stmt = $this->conn->prepare("
            INSERT INTO leave_history (LEAVEID, TYPEOFLEAVE, EMPLOYID, EMPNAME, CURR_BAL, CREDITS, NEW_BAL, REMARKS, UPDATEDATE)
            VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->bind_param("sisddds", $typeOfLeave, $employId, $empName, $currBal, $credits, $newBal, $remarks);
        $stmt->execute();
        $stmt->close();
    }

    // Utility function to get VL balance on a specific date (e.g., December)
    private function getVLBalanceOnDate($employId)
    {
        // Use masterlist connection if available, otherwise use main connection
        $connection = $this->masterListConnection ?: $this->conn;

        $stmt = $connection->prepare("
            SELECT VACATIONLEAVE
            FROM employee_masterlist
            WHERE EMPLOYID = ?
        ");

        // Bind the employee ID
        $stmt->bind_param("i", $employId);
        $stmt->execute();

        // Initialize the variable before binding
        $total = 0;
        $stmt->bind_result($total);
        $stmt->fetch();
        $stmt->close();

        // Return the leave balance if found, otherwise return 0
        return $total ?: 0;
    }

    private function setSystemStatus($status, $message = null)
    {
        $stmt = $this->conn->prepare("UPDATE system_status SET status = ?, message = ?, updated_at = NOW() WHERE id = 1");
        $stmt->bind_param("ss", $status, $message);
        $stmt->execute();
        $stmt->close();
    }



    public function auto_update_vl_and_vlincr()
    {
        $currentDate = date('Y-m-d');
        $connection = $this->masterListConnection ?: $this->conn;

        $this->setSystemStatus('maintenance', 'System is updating leave credits. Please wait...');

        $qry = $connection->query("
        SELECT EMPLOYID, ACCSTATUS, DATEHIRED, DATEREG, VACATIONLEAVE, VLINCR, 
               DATEMONTHLYINCR, VLYEARLYINCR, VLSLRESETDATE, EMPSTATUS, PRODLINE, SIL
        FROM employee_masterlist 
        WHERE ACCSTATUS = 1
    ");

        if ($qry === false) {
            $error = "Database query failed: " . $connection->error;
            file_put_contents(__DIR__ . '/auto_update_log.txt', date('Y-m-d H:i:s') . " - ERROR: $error\n", FILE_APPEND);
            return json_encode(["status" => "error", "message" => $error]);
        }

        $updatedEmployees = 0;
        $skippedEmployees = 0;

        while ($employee = $qry->fetch_assoc()) {
            try {
                $employId        = $employee['EMPLOYID'];
                $dateReg         = $employee['DATEREG'];
                $dateHired       = $employee['DATEHIRED'];
                $vacationLeave   = floatval($employee['VACATIONLEAVE']);
                $vlIncr          = floatval($employee['VLINCR']);
                $dateMonthlyIncr = $employee['DATEMONTHLYINCR'];
                $vlYearlyIncr    = $employee['VLYEARLYINCR'];
                $vlSlResetDate   = $employee['VLSLRESETDATE'];
                $empStatus       = $employee['EMPSTATUS'];
                $accStatus       = $employee['ACCSTATUS'];
                $prodLine        = $employee['PRODLINE'] ?? '';
                $sickLeave       = 7;

                // -------------------------------------------------------
                // STEP 1: SKIP INVALID DATE FIELDS
                // If any critical date field is empty, 0000-00-00, or
                // 1970-01-01 (unix epoch default), skip this employee
                // entirely to avoid wrong calculations.
                // -------------------------------------------------------
                $invalidDates = [$dateReg, $dateHired, $dateMonthlyIncr, $vlYearlyIncr, $vlSlResetDate];
                $hasInvalidDate = false;
                foreach ($invalidDates as $d) {
                    if (empty($d) || $d === '1970-01-01' || $d === '0000-00-00') {
                        $hasInvalidDate = true;
                        break;
                    }
                }
                if ($hasInvalidDate) {
                    file_put_contents(__DIR__ . '/auto_update_log.txt', date('Y-m-d H:i:s') . " - EMPLOYID $employId: Skipped (Invalid date fields)\n", FILE_APPEND);
                    $skippedEmployees++;
                    continue;
                }

                // -------------------------------------------------------
                // STEP 2: COMPUTE FIRST EARNING DATE
                // An employee starts earning VL/SIL 1 month after their
                // regularization date, on the last day of that month.
                // Example: DATEREG = 2024-01-15 → firstEarningDate = 2024-02-29
                // -------------------------------------------------------
                $firstEarningDate = date('Y-m-t', strtotime('+1 month', strtotime($dateReg)));

                // -------------------------------------------------------
                // STEP 3: IDENTIFY SPECIAL SIL EMPLOYEE (PL8)
                // Special SIL employees are those whose:
                //   - PRODLINE contains 'PL8'
                //   - EMPLOYID starts with '30'
                //   - ACCSTATUS is active (1)
                // These employees earn SIL (Service Incentive Leave)
                // instead of the standard VL (Vacation Leave).
                // -------------------------------------------------------
                $isSpecialSILEmployee = (
                    strpos($prodLine, 'PL8') !== false &&
                    strpos((string)$employId, '30') === 0 &&
                    $accStatus == 1
                );

                $employeeUpdated = false;

                // =======================================================
                // BLOCK A: REGULARIZATION
                // Triggered when:
                //   - EMPSTATUS = 0 (probationary)
                //   - Current date has reached or passed DATEREG
                //   - ACCSTATUS is not 2 (not separated/inactive)
                //
                // What it does:
                //   - Sets EMPSTATUS to 1 (regular)
                //   - Initializes SICKLEAVE to 7 days
                //   - Logs SL initialization in leave history
                // =======================================================
                if ($empStatus == '0' && $currentDate >= $dateReg && $accStatus != 2) {
                    $newEmpStatus = 1;
                    $sickLeave = 7;

                    $stmt = $connection->prepare("
                    UPDATE employee_masterlist 
                    SET EMPSTATUS = ?, SICKLEAVE = ?
                    WHERE EMPLOYID = ?
                ");
                    $stmt->bind_param("ddi", $newEmpStatus, $sickLeave, $employId);
                    $stmt->execute();
                    $stmt->close();

                    $this->insertLeaveHistory(
                        $employId,
                        'SICKLEAVE',
                        0,
                        $sickLeave,
                        $sickLeave,
                        'SL initialized upon regularization'
                    );

                    $employeeUpdated = true;

                    file_put_contents(
                        __DIR__ . '/auto_update_log.txt',
                        date('Y-m-d H:i:s') . " - EMPLOYID $employId: Regularized + SL initialized\n",
                        FILE_APPEND
                    );
                }

                // =======================================================
                // BLOCK B: FIRST LEAVE EARNING
                // Triggered when:
                //   - EMPSTATUS = 1 (regular)
                //   - ACCSTATUS is not 2
                //   - VLINCR is empty/zero (meaning no leave has been
                //     earned yet — this is the very first earning)
                //   - Current date is within the window:
                //     firstEarningDate to firstEarningDate + 6 months
                //
                // What it does for REGULAR employees:
                //   - Awards 1 month of VL (7/12)
                //   - Sets VLINCR = 7/12 (monthly rate going forward)
                //   - Sets DATEMONTHLYINCR to 1st of next month
                //   - Logs VL earning in leave history
                //
                // What it does for SPECIAL SIL (PL8) employees:
                //   - Awards 1 month of SIL (5/12)
                //   - Sets VLINCR = 5/12
                //   - Sets DATEMONTHLYINCR to 1st of next month
                //   - Logs SIL earning in leave history
                //
                // The 6-month window prevents awarding first leave to
                // employees whose records were missed for a long time.
                // =======================================================
                if ($empStatus == '1' && $accStatus != 2 && empty($vlIncr)) {
                    if ($currentDate >= $firstEarningDate && $currentDate <= date('Y-m-d', strtotime($firstEarningDate . ' +6 months'))) {
                        if (empty($firstEarningDate)) {
                            file_put_contents(
                                __DIR__ . '/auto_update_log.txt',
                                date('Y-m-d H:i:s') . " - EMPLOYID $employId: Skipped (First earning date is NULL or empty)\n",
                                FILE_APPEND
                            );
                        } elseif ($currentDate < $firstEarningDate) {
                            file_put_contents(
                                __DIR__ . '/auto_update_log.txt',
                                date('Y-m-d H:i:s') . " - EMPLOYID $employId: Skipped (Current date before first earning date $firstEarningDate)\n",
                                FILE_APPEND
                            );
                        } elseif ($currentDate > date('Y-m-d', strtotime($firstEarningDate . ' +6 months'))) {
                            file_put_contents(
                                __DIR__ . '/auto_update_log.txt',
                                date('Y-m-d H:i:s') . " - EMPLOYID $employId: Skipped (More than 6 months after first earning date $firstEarningDate)\n",
                                FILE_APPEND
                            );
                        } else {
                            if ($isSpecialSILEmployee) {
                                $silBalance = 5 / 12;
                                $nextMonthlyIncr = date('Y-m-01', strtotime("+1 month", strtotime($currentDate)));
                                $stmt = $connection->prepare("UPDATE employee_masterlist SET SIL = ?, DATEMONTHLYINCR = ?, VLINCR = ? WHERE EMPLOYID = ?");
                                $stmt->bind_param("dsdi", $silBalance, $nextMonthlyIncr, $silBalance, $employId);
                                $stmt->execute();
                                $stmt->close();
                                $employeeUpdated = true;
                                $this->insertLeaveHistory($employId, 'SIL', 0, $silBalance, $silBalance, 'First SIL earning - PL8');
                            } else {
                                $monthlyVL = 7 / 12;
                                $vacationLeave += $monthlyVL;
                                $nextMonthlyIncr = date('Y-m-01', strtotime("+1 month", strtotime($currentDate)));

                                $stmt = $connection->prepare("
                                UPDATE employee_masterlist 
                                SET VACATIONLEAVE = ?, DATEMONTHLYINCR = ?, VLINCR = ?
                                WHERE EMPLOYID = ?
                            ");
                                $stmt->bind_param("dsdi", $vacationLeave, $nextMonthlyIncr, $monthlyVL, $employId);
                                $stmt->execute();
                                $stmt->close();
                                $employeeUpdated = true;
                                $this->insertLeaveHistory(
                                    $employId,
                                    'VACATIONLEAVE',
                                    0,
                                    $monthlyVL,
                                    $vacationLeave,
                                    'First VL earning'
                                );
                            }
                        }
                    }
                }

                // =======================================================
                // BLOCK C: MONTHLY VL/SIL INCREMENT
                // Triggered when:
                //   - EMPSTATUS = 1 (regular)
                //   - DATEMONTHLYINCR is not null
                //   - Current date has reached or passed DATEMONTHLYINCR
                //   - Current date has reached or passed firstEarningDate
                //   - ACCSTATUS is not 2
                //
                // What it does for REGULAR employees:
                //   - Adds VLINCR to VACATIONLEAVE
                //   - Advances DATEMONTHLYINCR to 1st of next month
                //   - Logs the monthly VL earning in leave history
                //
                // What it does for SPECIAL SIL (PL8) employees:
                //   - Adds VLINCR to SIL balance
                //   - Advances DATEMONTHLYINCR to 1st of next month
                //   - Logs the monthly SIL earning in leave history
                //
                // Note: VLINCR is set by Block B (first earning) and
                // updated by Block D (yearly reset) so the rate
                // automatically steps up each anniversary year.
                // =======================================================
                if (
                    $empStatus == '1'
                    && $dateMonthlyIncr != null
                    && $currentDate >= $dateMonthlyIncr
                    && $currentDate >= $firstEarningDate
                    && $accStatus != 2
                ) {
                    $nextMonthlyIncr = date('Y-m-01', strtotime("+1 month", strtotime($currentDate)));
                    if ($isSpecialSILEmployee) {
                        $currentSIL = floatval($employee['SIL'] ?? 0);
                        $newSILBalance = $currentSIL + $vlIncr;
                        $stmt = $connection->prepare("UPDATE employee_masterlist SET SIL = ?, DATEMONTHLYINCR = ? WHERE EMPLOYID = ?");
                        $stmt->bind_param("dsi", $newSILBalance, $nextMonthlyIncr, $employId);
                        $stmt->execute();
                        $stmt->close();
                        $this->insertLeaveHistory(
                            $employId,
                            'SIL',
                            $currentSIL,
                            $vlIncr,
                            $newSILBalance,
                            date('F', strtotime('-1 month', strtotime($currentDate))) . " Monthly SIL earnings"
                        );
                    } else {
                        $vacationLeave += $vlIncr;
                        $stmt = $connection->prepare("UPDATE employee_masterlist SET VACATIONLEAVE = ?, DATEMONTHLYINCR = ? WHERE EMPLOYID = ?");
                        $stmt->bind_param("dsi", $vacationLeave, $nextMonthlyIncr, $employId);
                        $stmt->execute();
                        $stmt->close();
                        $this->insertLeaveHistory(
                            $employId,
                            'VACATIONLEAVE',
                            $vacationLeave - $vlIncr,
                            $vlIncr,
                            $vacationLeave,
                            date('F', strtotime('-1 month', strtotime($currentDate))) . " Monthly VL earnings"
                        );
                    }
                    $employeeUpdated = true;
                }

                // =======================================================
                // BLOCK D: YEARLY RESET
                // Triggered when:
                //   - Current date has reached or passed VLYEARLYINCR
                //   - ACCSTATUS is not 2
                //   - EMPSTATUS = 1 (regular)
                //   - Current date has reached or passed firstEarningDate
                //
                // -------------------------------------------------------
                // FOR SPECIAL SIL (PL8) EMPLOYEES:
                //   - Keeps VLINCR fixed at 5/12 (SIL never steps up)
                //   - Advances VLYEARLYINCR by 1 year
                //   - Advances VLSLRESETDATE by 1 year
                //   - Logs yearly SIL reset in leave history
                //   - Old hires (≤ Mar 30 2024): also resets BL, EL,
                //     Bereavement leave
                //
                // -------------------------------------------------------
                // FOR REGULAR EMPLOYEES:
                //
                //   VLINCR UPDATE:
                //   - Old hires (≤ Mar 30 2024):
                //       VLINCR steps up based on calendar years since DATEREG year.
                //       Only the YEAR difference matters — month/day is ignored.
                //
                //       Example: DATEREG = 2022 (any date)
                //         Reg year  (2022): 7/12  — prorated first earning
                //         Year +1   (2023): 7/12  — still base rate
                //         Year +2   (2024): 8/12  — step-up begins here
                //         Year +3   (2025): 9/12
                //         Year +4   (2026): 10/12
                //         Year +5   (2027): 11/12
                //         Year +6+  (2028): 12/12 — capped
                //
                //       Formula: min(7 + max(0, $years - 1), 12) / 12
                //       where $years = current year - DATEREG year (integer, no month/day adjustment)
                //
                //   - New hires (> Mar 30 2024):
                //       VLINCR stays fixed at 7/12 forever
                //
                //   OTHER RESETS:
                //   - SICKLEAVE reset to 7
                //   - Old hires: BIRTHDAYLEAVE=1, EMERGENCYLEAVE=1,
                //                BEREAVEMENTLEAVE=1
                //   - New hires: BEREAVEMENTLEAVE=1 only
                //   - Advances VLYEARLYINCR by 1 year
                //   - Advances VLSLRESETDATE by 1 year
                //
                //   NOTE: VACATIONLEAVE is NOT updated here.
                //   Block C (monthly) handles VACATIONLEAVE automatically
                //   using the newly updated VLINCR rate next month.
                // =======================================================
                if (
                    $currentDate >= $vlYearlyIncr
                    && $accStatus != 2
                    && $empStatus == '1'
                    && strtotime($currentDate) >= strtotime($firstEarningDate)
                ) {
                    if ($isSpecialSILEmployee) {
                        $currentSIL = floatval($employee['SIL'] ?? 0);
                        $newVlIncr = 5 / 12;

                        $nextYearlyIncr = date('Y-m-d', strtotime("+1 year", strtotime($vlYearlyIncr)));
                        $nextVlSlReset  = date('Y-m-d', strtotime("+1 year", strtotime($vlSlResetDate)));

                        $stmt = $connection->prepare("
                        UPDATE employee_masterlist 
                        SET VLINCR = ?, VLYEARLYINCR = ?, VLSLRESETDATE = ?
                        WHERE EMPLOYID = ?
                    ");
                        $stmt->bind_param("dssi", $newVlIncr, $nextYearlyIncr, $nextVlSlReset, $employId);
                        $stmt->execute();
                        $stmt->close();
                        $employeeUpdated = true;

                        $this->insertLeaveHistory($employId, 'SIL', $currentSIL, 0, $currentSIL, 'Yearly SIL reset (PL8 Employee)');

                        if (strtotime($dateHired) <= strtotime('2024-03-30')) {
                            $this->insertLeaveHistory($employId, 'BIRTHDAYLEAVE', 0, 1, 1, 'BL Initialized (Yearly)');
                            $this->insertLeaveHistory($employId, 'EMERGENCYLEAVE', 0, 1, 1, 'EL Initialized (Yearly)');
                            $this->insertLeaveHistory($employId, 'BEREAVEMENTLEAVE', 0, 1, 1, 'Bereavement Leave Initialized (Yearly)');
                        }
                    } else {
                        // -------------------------------------------------------
                        // FIX: Compute years as a simple calendar year difference.
                        // Do NOT subtract 1 based on month/day — only the year
                        // number matters per business rule.
                        //
                        // Example: DATEREG = 2022-09-15, currentDate = 2024-03-01
                        //   $years = 2024 - 2022 = 2
                        //   earnedVl = min(7 + max(0, 2 - 1), 12) = min(8, 12) = 8
                        //   newVlIncr = 8/12
                        // -------------------------------------------------------
                        $years = date('Y', strtotime($currentDate)) - date('Y', strtotime($dateReg));

                        // Compute earned VL cap for this year
                        if (strtotime($dateHired) <= strtotime('2024-03-30')) {
                            // Step-up starts 2 calendar years after reg year (offset by 1).
                            // Year 0 (reg year) and Year 1 both earn 7/12.
                            // Year 2+ begins stepping up: 8/12, 9/12, ... capped at 12/12.
                            $earnedVl = min(7 + max(0, $years - 1), 12);
                        } else {
                            $earnedVl = 7; // fixed forever for new hires
                        }

                        // Set the correct monthly increment rate for this year
                        $newVlIncr = $earnedVl / 12;

                        $nextYearlyIncr = date('Y-m-d', strtotime("+1 year", strtotime($vlYearlyIncr)));
                        $nextVlSlReset  = date('Y-m-d', strtotime("+1 year", strtotime($vlSlResetDate)));

                        $birthdayLeave = $emergencyLeave = $bereavementLeave = 0;
                        if (strtotime($dateHired) <= strtotime('2024-03-30')) {
                            $birthdayLeave = $emergencyLeave = $bereavementLeave = 1;
                        } else {
                            $bereavementLeave = 1;
                        }

                        // VACATIONLEAVE is intentionally excluded here.
                        // Block C (monthly) will use the updated VLINCR
                        // to add VL on its next scheduled run.
                        $stmt = $connection->prepare("
                        UPDATE employee_masterlist 
                        SET VLINCR = ?, VLYEARLYINCR = ?, VLSLRESETDATE = ?, 
                            SICKLEAVE = ?, BIRTHDAYLEAVE = ?, EMERGENCYLEAVE = ?, BEREAVEMENTLEAVE = ?
                        WHERE EMPLOYID = ?
                    ");
                        $stmt->bind_param(
                            "dssdddis",
                            $newVlIncr,
                            $nextYearlyIncr,
                            $nextVlSlReset,
                            $sickLeave,
                            $birthdayLeave,
                            $emergencyLeave,
                            $bereavementLeave,
                            $employId
                        );
                        $stmt->execute();
                        $stmt->close();
                        $employeeUpdated = true;

                        $this->insertLeaveHistory($employId, 'SICKLEAVE', 0, $sickLeave, $sickLeave, 'SL Reset (Yearly)');

                        if ($birthdayLeave) {
                            $this->insertLeaveHistory($employId, 'BIRTHDAYLEAVE', 0, 1, 1, 'BL Initialized (Yearly)');
                            $this->insertLeaveHistory($employId, 'EMERGENCYLEAVE', 0, 1, 1, 'EL Initialized (Yearly)');
                        }

                        $this->insertLeaveHistory($employId, 'BEREAVEMENTLEAVE', 0, 1, 1, 'Bereavement Leave Initialized (Yearly)');
                    }
                }

                $employeeUpdated ? $updatedEmployees++ : $skippedEmployees++;
            } catch (Exception $e) {
                $skippedEmployees++;
                file_put_contents(__DIR__ . '/auto_update_log.txt', date('Y-m-d H:i:s') . " - ERROR: EMPLOYID $employId - " . $e->getMessage() . "\n", FILE_APPEND);
            }
        }

        $summary = "$updatedEmployees employees updated. $skippedEmployees skipped.";
        $this->setSystemStatus('online', 'System is running normally');
        file_put_contents(__DIR__ . '/auto_update_log.txt', date('Y-m-d H:i:s') . " - SUMMARY: $summary\n", FILE_APPEND);

        return json_encode(["status" => "success", "message" => $summary]);
    }
}
