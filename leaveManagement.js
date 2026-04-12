const BASE_URL = _base_url_ + "classes/Leave.php";

// --- Debounce utility to prevent multiple clicks ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- Prevent multiple submissions ---
let isSubmitting = false;

// --- API functions for AJAX calls ---
async function getApproversAndStatus(selectedEmployeeID, leaveID) {
  try {
    const response = await $.ajax({
      url: `${BASE_URL}?f=get_approvers_and_status`,
      type: "POST",
      data: { EMPLOYID: selectedEmployeeID, LEAVEID: leaveID },
    });
    const res = JSON.parse(response);
    if (res.status === "success") return res.data;
    else return null;
  } catch (error) {
    console.error("[log] getApproversAndStatus error:", error);
    return null;
  }
}

async function getOperationalDirector() {
  try {
    const response = await $.ajax({
      url: _base_url_ + "classes/Leave.php?f=get_operational_director",
      type: "POST",
    });
    const res = JSON.parse(response);
    if (res.status === "success") return res.data;
    else return null;
  } catch (error) {
    console.error("[log] getOperationalDirector error:", error);
    return null;
  }
}

async function updateLeaveInDatabase(updateData) {
  try {
    const response = await $.ajax({
      url: `${BASE_URL}?f=update_leave`,
      type: "POST",
      data: updateData,
      dataType: "json",
    });
    return response;
  } catch (error) {
    return { status: "error", message: error.message || "Request failed" };
  }
}

async function updateLeaveInMasterList(
  selectedEmployeeID,
  remainingLeave,
  leaveTypeFull,
  leaveID,
  remarks,
  isCancellation,
) {
  try {
    const response = await $.ajax({
      url: `${BASE_URL}?f=update_master_leave`,
      type: "POST",
      data: {
        EMPLOYID: selectedEmployeeID,
        LEAVETYPE: leaveTypeFull,
        REMAINING_LEAVE: remainingLeave,
        LEAVEID: leaveID,
        REMARKS: remarks,
        IS_CANCELLATION: isCancellation,
      },
      dataType: "json",
    });
    return response.status === "success";
  } catch (error) {
    return false;
  }
}

async function submitLeaveRequest(formData) {
  try {
    console.debug(
      "[DEBUG] Submitting leave request:",
      Object.fromEntries(formData.entries()),
    );
    const response = await fetch(`${BASE_URL}?f=submit_leave`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    console.debug("[DEBUG] Leave request response:", result);
    return result;
  } catch (error) {
    showToast(
      "An error occurred while submitting your leave request.",
      "error",
    );
    console.error("[DEBUG] submitLeaveRequest error:", error);
    throw error;
  }
}

async function uploadLeaveAttachments(attachmentFormData) {
  try {
    const response = await fetch(`${BASE_URL}?f=save_attachment`, {
      method: "POST",
      body: attachmentFormData,
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("[uploadLeaveAttachments] Invalid JSON:", text);
      return { status: "failed", message: "Invalid server response." };
    }
  } catch (error) {
    console.error("[uploadLeaveAttachments] Network error:", error);
    return { status: "failed", message: "Network error while uploading." };
  }
}

async function saveNormalLeave({
  formData,
  employeeID,
  remainingLeaveDays,
  masterLeave,
  leaveID,
  remarks,
}) {
  const empPosition = $("#EMPPOSITION").val();
  let leaveStatus;

  if (empPosition == 5) {
    leaveStatus = "Approved";
  } else {
    leaveStatus =
      masterLeave == "MATERNITYLEAVE" ? "For HR Verification" : "Pending";
  }

  const updated = await updateLeaveInDatabase({
    LEAVEID: leaveID,
    EMPLOYID: employeeID,
    LEAVESTATUS: leaveStatus,
    REMARKS: remarks,
  });

  if (updated) {
    await updateLeaveInMasterList(
      employeeID,
      remainingLeaveDays,
      masterLeave,
      leaveID,
      remarks,
      0,
    );
  }

  return updated;
}

async function saveAppeal(appealData) {
  try {
    const response = await $.ajax({
      url: `${BASE_URL}?f=save_appeal`,
      type: "POST",
      data: appealData,
      dataType: "json",
      processData: false,
      contentType: false,
    });
    return response.status === "success";
  } catch (error) {
    console.error("[DEBUG] saveAppeal error:", error);
    return false;
  }
}

$(document).ready(function () {
  const leaveMapping = {
    SL: "SICKLEAVE",
    VL: "VACATIONLEAVE",
    EL: "EMERGENCYLEAVE",
    BL: "BIRTHDAYLEAVE",
    Brl: "BEREAVEMENTLEAVE",
    SPL: "SPL",
    MiL: "MILITARY",
    PL: "PATERNITYLEAVE",
    ML: "MATERNITYLEAVE",
    SLW: "SLW",
    VAWC: "VAWC",
  };

  const leaveMappingName = {
    SL: "Sick Leave",
    VL: "Vacation Leave",
    EL: "Emergency Leave",
  };

  function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 6 || day === 0;
  }

  function getLeaveFilingRequirements({ isLate, leaveType }) {
    const type = (leaveType || "").toUpperCase();

    if (type === "VL" && isLate) {
      return { requireAppeal: true, requireAttachment: false };
    }
    if (["EL", "BRL"].includes(type)) {
      return { requireAppeal: false, requireAttachment: true };
    }
    return { requireAppeal: false, requireAttachment: false };
  }

  function openModal(type, leaveResult, extraData = {}) {
    if (type === "appeal") {
      $("#leaveId").val(leaveResult.LEAVEID);
      $("#employId").val(extraData.employeeID || "");
      $("#remainingLeave").val(extraData.remainingLeaveDays || "");
      $("#masterLeave").val(extraData.masterLeave || "");
      $("#VL_USED_HOURS").val(extraData.vlUsedHours || "");
      $("#selectedLeave").val(extraData.selectedLeave || "");
      $("#USE_VL").val(extraData.useVL || "0");

      $("#triggerLateModal").trigger("click");
    }

    if (type === "attachment") {
      $("#attachmentModal")
        .data("existingLeaveID", leaveResult.LEAVEID)
        .data("employeeID", extraData.employeeID || "")
        .data("remainingLeaveDays", extraData.remainingLeaveDays || "")
        .data("masterLeave", extraData.masterLeave || "")
        .data("selectedLeave", extraData.selectedLeave || "");

      $("#triggerAttachmentModal").trigger("click");
    }
  }

  function calculateTotalLeaveHours(
    leaveDuration,
    leaveHours,
    dateStart,
    dateEnd,
    shifttype,
    team,
  ) {
    const hoursPerDay = parseInt(leaveHours, 10);

    if (leaveDuration === "half-day") {
      return hoursPerDay;
    } else {
      const startDate = new Date(dateStart + "T12:00:00");
      const endDate = new Date(dateEnd + "T12:00:00");

      let totalDays = 0;
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const day = currentDate.getDay();

        if (!(shifttype == "1" && team == "1" && (day === 0 || day === 6))) {
          totalDays++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const totalHours = totalDays * hoursPerDay;

      console.log(
        `Start=${dateStart}, End=${dateEnd}, ValidDays=${totalDays}, Hours/day=${hoursPerDay}, TotalHours=${totalHours}`,
      );

      return totalHours;
    }
  }

  function setButtonLoading($btn, isLoading, text = "Submit") {
    const $spinner = $btn.find(".spinner-border");
    if (isLoading) {
      $spinner.removeClass("hidden");
      $btn.prop("disabled", true);
      $btn.find("span:not(.spinner-border)").text(text);
    } else {
      $spinner.addClass("hidden");
      $btn.prop("disabled", false);
      $btn.find("span:not(.spinner-border)").text(text);
    }
  }

  function handleLeaveFormSubmission() {
    // Debounced submit handler to prevent duplicate submissions
    const debouncedSubmit = debounce(async function (formElement, event) {
      if (isSubmitting) {
        console.log("Already submitting, please wait...");
        return;
      }

      isSubmitting = true;
      const $submitBtn = $(formElement).find('button[type="submit"]');
      setButtonLoading($submitBtn, true, "Submitting...");

      try {
        const leaveDuration = $("input[name='LEAVE_DURATION']:checked").val();
        const leaveHours = $("input[name='LEAVE_HRS']:checked").val();
        const selectedLeave = $("select[name='TYPEOFLEAVE']").val();
        const reason = $("#reason").val().trim();
        const employeeID = $("#employId").val();
        const masterLeave = $("#masterLeave").val();
        const empPosition = $("#EMPPOSITION").val();
        const formData = new FormData(formElement);

        // ✅ Validations
        if (!selectedLeave) {
          showToast("Please select a type of leave.", "warning");
          isSubmitting = false;
          setButtonLoading($submitBtn, false, "Submit");
          return;
        }
        if (!leaveDuration || !leaveHours) {
          showToast("Please select both leave duration and hours.", "warning");
          isSubmitting = false;
          setButtonLoading($submitBtn, false, "Submit");
          return;
        }
        if (!reason) {
          showToast("Please provide a reason for your leave.", "warning");
          isSubmitting = false;
          setButtonLoading($submitBtn, false, "Submit");
          return;
        }

        // Leave Status
        let leaveStatus =
          empPosition == 5
            ? "Approved"
            : masterLeave == "MATERNITYLEAVE"
              ? "For HR Verification"
              : "Pending";

        const shifttype = $("#shiftType").val();
        const team = $("#team").val();
        const checkDate =
          $("#singleDate").val().trim() || $("#dateStart").val().trim();
        if (shifttype == "1" && team == "1" && isWeekend(checkDate)) {
          showToast(
            "Weekend filing is not allowed for your shift/team.",
            "error",
          );
          isSubmitting = false;
          setButtonLoading($submitBtn, false, "Submit");
          return;
        }

        // Dates
        let dateStart, dateEnd;
        if (leaveDuration === "half-day") {
          dateStart = dateEnd = $("#singleDate").val().trim();
          formData.set("DATESTART", dateStart);
          formData.set("DATEEND", dateEnd);
        } else {
          dateStart = $("#dateStart").val().trim();
          dateEnd = $("#dateEnd").val().trim();
          formData.set("DATESTART", dateStart);
          formData.set("DATEEND", dateEnd);
        }

        // Leave hours calculation
        const requestedLeaveHours = calculateTotalLeaveHours(
          leaveDuration,
          leaveHours,
          dateStart,
          dateEnd,
          shifttype,
          team,
        );
        let availableLeaveDays = parseFloat(leaveBalances[selectedLeave]) || 0;
        const deductionInDays =
          Math.round((requestedLeaveHours / 8) * 100) / 100;
        const remainingLeaveDays = Math.max(
          0,
          availableLeaveDays - deductionInDays,
        );
        const paidLeaveHours = Math.min(
          requestedLeaveHours,
          availableLeaveDays * 8,
        );
        const unpaidLeaveHours = requestedLeaveHours - paidLeaveHours;

        formData.set("TOTAL_LEAVE_HRS", requestedLeaveHours);
        formData.set("PAID_LEAVE_HOURS", paidLeaveHours);
        formData.set("UNPAID_LEAVE_HOURS", unpaidLeaveHours);

        // Late filing check
        let lateFiling = 0;
        if (selectedLeave === "VL") {
          const postDate = new Date($("#datePosted").val().trim());
          const startDate = new Date(checkDate);
          const diffDays = Math.ceil(
            (startDate - postDate) / (1000 * 60 * 60 * 24),
          );
          if (diffDays < 2) lateFiling = 1;
        }

        formData.set("CURR_BAL", availableLeaveDays);
        formData.set("CREDITS", deductionInDays);
        formData.set("NOOFHOURS", requestedLeaveHours);
        formData.set("REMAINING_LEAVE", remainingLeaveDays);
        formData.set("EMPLOYID", employeeID);
        formData.set("LATEFILING", lateFiling);

        // Check requirements for appeal or attachment
        const requirements = getLeaveFilingRequirements({
          isLate: lateFiling === 1,
          leaveType: selectedLeave,
        });

        if (requirements.requireAppeal) {
          formData.set("LEAVESTATUS", "Appeal Upload Failed");
          const leaveResult = await submitLeaveRequest(formData);
          if (leaveResult.status === "success") {
            openModal("appeal", leaveResult, {
              employeeID,
              remainingLeaveDays,
              masterLeave,
              vlUsedHours: requestedLeaveHours,
              selectedLeave,
            });
          }
          isSubmitting = false;
          setButtonLoading($submitBtn, false, "Submit");
          return;
        }

        if (requirements.requireAttachment) {
          formData.set("LEAVESTATUS", "Attachment Upload Failed");
          const leaveResult = await submitLeaveRequest(formData);
          if (leaveResult.status === "success") {
            openModal("attachment", leaveResult, {
              employeeID,
              remainingLeaveDays,
              masterLeave: $("#masterLeave").val(),
              selectedLeave,
            });
          }
          isSubmitting = false;
          setButtonLoading($submitBtn, false, "Submit");
          return;
        }

        // Submit normal leave
        formData.set("LEAVESTATUS", leaveStatus);
        const leaveResult = await submitLeaveRequest(formData);
        if (leaveResult.status === "success") {
          await saveNormalLeave({
            formData,
            employeeID,
            remainingLeaveDays,
            masterLeave: $("#masterLeave").val(),
            leaveID: leaveResult.LEAVEID,
            remarks: "Leave filed",
          });
          showToast("Leave submitted successfully!", "success");
          setTimeout(() => location.reload(), 1000);
        }
      } catch (err) {
        console.error(err);
        showToast("An error occurred during leave submission.", "error");
      } finally {
        isSubmitting = false;
        setButtonLoading($submitBtn, false, "Submit");
      }
    }, 500); // 500ms debounce to prevent rapid submissions

    $("#leaveForm").on("submit", function (event) {
      event.preventDefault();
      debouncedSubmit(this, event);
    });
  }

  $(document)
    .off("submit", "#appeal-form")
    .on("submit", "#appeal-form", async function (e) {
      e.preventDefault();
      if (isSubmitting) return console.log("Already submitting appeal...");

      isSubmitting = true;
      const $submitBtn = $(this).find('button[type="submit"]');
      setButtonLoading($submitBtn, true, "Submitting...");

      try {
        const leaveId = $("#leaveId").val();
        const employId = $("#employId").val();
        const reason = $("input[name='selectedReason']:checked").val() || "";
        const fileInput = $("#multiple_files")[0].files;
        const masterLeave = $("#masterLeave").val();
        const selectedLeave = $("#selectedLeave").val();
        const vlUsedHours = parseFloat($("#VL_USED_HOURS").val() || 0);

        if (!leaveId || !employId || !reason || fileInput.length === 0) {
          showToast(
            "Please fill all required fields, including uploading at least one file.",
            "warning",
          );
          return;
        }

        let availableLeaveDays = parseFloat(leaveBalances[selectedLeave]) || 0;
        const deductionInDays = Math.round((vlUsedHours / 8) * 100) / 100;
        const remainingLeave = Math.max(
          0,
          availableLeaveDays - deductionInDays,
        );

        const formData = new FormData();
        formData.append("leaveId", leaveId);
        formData.append("employId", employId);
        formData.append("reason", reason);
        formData.append("WITH_APPEAL", 1);
        formData.append("APPEAL_STATUS", "Pending");
        formData.append("REMAINING_LEAVE", remainingLeave);
        formData.append("MASTERLEAVE", masterLeave);
        formData.append("SELECTED_LEAVE", selectedLeave);

        for (let file of fileInput) {
          formData.append("files[]", file);
        }

        const success = await saveAppeal(formData);
        if (!success) {
          showToast("Failed to submit appeal. Please try again.", "error");
          return;
        }

        const approvers = await getApproversAndStatus(employId, leaveId);
        const operationalDirector = await getOperationalDirector();

        if (!approvers || !operationalDirector) {
          showToast("Failed to fetch approvers or director.", "error");
          return;
        }

        const masterListUpdated = await updateLeaveInMasterList(
          employId,
          remainingLeave,
          masterLeave,
          leaveId,
          "Appeal uploaded successfully.",
          false,
        );

        if (!masterListUpdated) {
          showToast(
            "Files uploaded but failed to update leave balance.",
            "warning",
          );
        }

        const updateData = {
          LEAVEID: leaveId,
          EMPLOYID: employId,
          APPROVER1: approvers.APPROVER2,
          APPROVER2: operationalDirector.EMPLOYID,
          LEAVESTATUS: "For Dept head approval",
          WITH_APPEAL: "1",
          REMAINING_LEAVE: remainingLeave,
        };

        const updateResult = await updateLeaveInDatabase(updateData);
        if (updateResult) {
          showToast("Appeal submitted and routed for approval.", "success");
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast(
            "Appeal uploaded but failed to update leave for approval.",
            "warning",
          );
        }
      } catch (err) {
        console.error(err);
        showToast("Error submitting appeal.", "error");
      } finally {
        isSubmitting = false;
        setButtonLoading($submitBtn, false, "Submit");
      }
    });

  $(document)
    .off("submit", "#attachmentUploadForm")
    .on("submit", "#attachmentUploadForm", async function (e) {
      e.preventDefault();
      if (isSubmitting) return console.log("Already submitting attachment...");

      isSubmitting = true;
      const $submitBtn = $(this).find('button[type="submit"]');
      setButtonLoading($submitBtn, true, "Uploading...");

      try {
        const fileInput = $("#attachmentFile")[0].files;
        if (fileInput.length === 0) {
          showToast("Please upload a file before submitting.", "warning");
          return;
        }

        const attachmentFormData = new FormData(this);
        const leaveId = $("#attachmentModal").data("existingLeaveID");
        const employId = $("#attachmentModal").data("employeeID");
        const selectedLeave =
          $("#attachmentModal").data("selectedLeave") ||
          $("select[name='TYPEOFLEAVE']").val();
        const masterLeave =
          $("#attachmentModal").data("masterLeave") || $("#masterLeave").val();

        let availableLeaveDays = parseFloat(leaveBalances[selectedLeave]) || 0;
        let requestedLeaveHours = 8;
        let deductionInDays = Math.round((requestedLeaveHours / 8) * 100) / 100;
        let remainingLeaveDays = Math.max(
          0,
          availableLeaveDays - deductionInDays,
        );

        attachmentFormData.append("leaveId", leaveId);
        attachmentFormData.append("employId", employId);
        for (let file of fileInput) {
          attachmentFormData.append("files[]", file);
        }

        const result = await uploadLeaveAttachments(attachmentFormData);

        if (result.status === "success") {
          const masterListUpdated = await updateLeaveInMasterList(
            employId,
            remainingLeaveDays,
            masterLeave,
            leaveId,
            "Attachment submitted",
            false,
          );

          if (!masterListUpdated) {
            showToast(
              "Attachment uploaded but failed to update leave balance.",
              "warning",
            );
          }

          const updated = await updateLeaveInDatabase({
            LEAVEID: leaveId,
            EMPLOYID: employId,
            LEAVESTATUS: "Pending",
            REMARKS: "Attachment submitted",
          });

          if (updated && updated.status === "success") {
            showToast(
              updated.message || "Attachment submitted successfully!",
              "success",
            );
            setTimeout(() => location.reload(), 1000);
          } else {
            showToast(
              (updated && updated.message) ||
                "Attachment saved but failed to update leave status.",
              "warning",
            );
          }
        } else {
          showToast(result.message || "Failed to upload attachment.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error uploading attachment.", "error");
      } finally {
        isSubmitting = false;
        setButtonLoading($submitBtn, false, "Submit");
      }
    });

  $("select[name='TYPEOFLEAVE']").change(function () {
    const selectedLeave = $(this).val();
    const masterLeave = leaveMapping[selectedLeave] || "";
    $("#masterLeave").val(masterLeave);
    console.log("Selected leave:", selectedLeave, "Master leave:", masterLeave);
    $("#leaveBalanceDisplay").text(leaveBalances[selectedLeave] || "N/A");
    console.log("Leave balance:", leaveBalances[selectedLeave] || "N/A");
  });

  handleLeaveFormSubmission();
});
