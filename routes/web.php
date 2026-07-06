<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\StatsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::get('/org/{organization:slug}', [DashboardController::class, 'organizationDashboard'])->name('org.dashboard');

Route::get('/submit', [IssueController::class, 'create'])->name('issues.create');
Route::post('/issues', [IssueController::class, 'store'])->name('issues.store')->middleware('throttle:3,1');
Route::get('/issues/reference/{reference_code}', [IssueController::class, 'showReference'])->name('issues.show-reference');
Route::get('/status', [IssueController::class, 'trackStatus'])->name('status.check');
Route::post('/issues/{issue}/feedback', [IssueController::class, 'submitFeedback'])->name('issues.feedback');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AdminController::class, 'showLogin'])->name('login');
    Route::post('/login', [AdminController::class, 'login']);

    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::patch('/issues/{issue}/status', [AdminController::class, 'updateStatus'])->name('issues.update-status');
        Route::post('/issues/{issue}/assign', [AdminController::class, 'assignIssue'])->name('issues.assign');
        Route::get('/organizations', [OrganizationController::class, 'index'])->name('organizations');
        Route::post('/organizations', [OrganizationController::class, 'store'])->name('organizations.store');
        Route::post('/organizations/{organization}/toggle', [OrganizationController::class, 'toggleActive'])->name('organizations.toggle');
    });
});

Route::get('/api/stats/overview', [StatsController::class, 'overview']);
Route::get('/api/stats/categories', [StatsController::class, 'categoryBreakdown']);
Route::get('/api/stats/trends', [StatsController::class, 'issuesOverTime']);
