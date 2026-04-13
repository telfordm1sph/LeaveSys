<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Admin role filtering is disabled — all authenticated users can access admin routes.
        // Re-enable the block below once the admin table is seeded.

        // if (session('emp_data')) {
        //     $checkIfExists = DB::table('admin')
        //         ->where('emp_id', session('emp_data')['emp_id'])
        //         ->exists();
        //     if (!$checkIfExists) {
        //         return redirect()->route('dashboard');
        //     }
        // }

        return $next($request);
    }
}
