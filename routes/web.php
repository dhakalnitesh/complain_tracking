<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\IssueController as AdminIssueController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\Admin\StaffController as AdminStaffController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IssueController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\Staff\IssueController as StaffIssueController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\FlagController;
use App\Http\Controllers\UpvoteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/feed', [App\Http\Controllers\FeedController::class, 'index'])->name('feed');

Route::get('/org/{organization:slug}', [DashboardController::class, 'organizationDashboard'])->name('org.dashboard');

Route::get('/submit', [IssueController::class, 'create'])->name('issues.create');
Route::post('/issues', [IssueController::class, 'store'])->name('issues.store')->middleware('throttle:3,1');
Route::get('/issues/reference/{reference_code}', [IssueController::class, 'showReference'])->name('issues.show-reference');
Route::get('/status', [IssueController::class, 'trackStatus'])->name('status.check')->middleware('throttle:10,1');
Route::post('/issues/{issue}/feedback', [IssueController::class, 'submitFeedback'])->name('issues.feedback')->middleware('throttle:5,1');
Route::get('/issues/photo/{reference_code}', [PhotoController::class, 'show'])->name('issues.photo');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:3,1');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/issues', [AdminIssueController::class, 'index'])->name('issues.index');
        Route::patch('/issues/{issue}/status', [AdminIssueController::class, 'updateStatus'])->name('issues.update-status');
        Route::post('/issues/{issue}/assign', [AdminIssueController::class, 'assign'])->name('issues.assign');
        Route::get('/organizations', [OrganizationController::class, 'index'])->name('organizations');
        Route::post('/organizations', [OrganizationController::class, 'store'])->name('organizations.store');
        Route::post('/organizations/{organization}/toggle', [OrganizationController::class, 'toggleActive'])->name('organizations.toggle');

        Route::get('/staff', [AdminStaffController::class, 'index'])->name('staff');
        Route::get('/staff/create', [AdminStaffController::class, 'create'])->name('staff.create');
        Route::post('/staff', [AdminStaffController::class, 'store'])->name('staff.store');
        Route::get('/staff/{user}/edit', [AdminStaffController::class, 'edit'])->name('staff.edit');
        Route::match(['put', 'post'], '/staff/{user}', [AdminStaffController::class, 'update'])->name('staff.update');
        Route::delete('/staff/{user}', [AdminStaffController::class, 'destroy'])->name('staff.destroy');

        Route::get('/staff/{user}/identity-document/{side}', [App\Http\Controllers\Admin\IdentityDocumentController::class, 'show'])->name('staff.identity-document');

        Route::get('/staff/{user}/issues', [AdminStaffController::class, 'issues'])->name('staff.issues');

        Route::get('/issues/{issue}', [AdminIssueController::class, 'show'])->name('issues.show');
        Route::get('/export/csv', [AdminIssueController::class, 'exportCsv'])->name('issues.export-csv');

        Route::get('/moderation', [ModerationController::class, 'index'])->name('moderation');
        Route::post('/moderation/{flag}/dismiss', [ModerationController::class, 'dismiss'])->name('moderation.dismiss');
        Route::post('/moderation/{flag}/hide', [ModerationController::class, 'hide'])->name('moderation.hide');
        Route::delete('/moderation/{flag}', [ModerationController::class, 'deleteContent'])->name('moderation.delete');
    });
});

Route::middleware(['auth', 'staff'])->prefix('staff')->name('staff.')->group(function () {
    Route::get('/issues/{issue}', [StaffIssueController::class, 'show'])->name('issues.show');
    Route::post('/issues/{issue}/comment', [StaffIssueController::class, 'comment'])->name('issues.comment');
});

Route::get('/api/stats/overview', [StatsController::class, 'overview']);
Route::get('/api/stats/categories', [StatsController::class, 'categoryBreakdown']);
Route::get('/api/stats/trends', [StatsController::class, 'issuesOverTime']);
Route::get('/api/track/{reference_code}', [App\Http\Controllers\Api\TrackController::class, 'show'])->name('api.track');

Route::post('/api/issues/{issue}/upvote', [UpvoteController::class, 'toggle'])->name('upvote.toggle');
Route::get('/issues/{issue}/comments', [CommentController::class, 'index'])->name('comments.index');
Route::post('/issues/{issue}/comments', [CommentController::class, 'store'])->name('comments.store');
Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

Route::post('/issues/{issue}/flag', [FlagController::class, 'flagIssue'])->name('issues.flag');
Route::post('/comments/{comment}/flag', [FlagController::class, 'flagComment'])->name('comments.flag');

Route::prefix('org-admin')->name('org-admin.')->middleware(['auth', 'org-admin'])->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\OrgAdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/departments', [App\Http\Controllers\OrgAdminController::class, 'departments'])->name('departments');
    Route::post('/departments', [App\Http\Controllers\OrgAdminController::class, 'storeDepartment'])->name('departments.store');
    Route::get('/staff', [App\Http\Controllers\OrgAdminController::class, 'staff'])->name('staff');
    Route::post('/staff', [App\Http\Controllers\OrgAdminController::class, 'storeStaff'])->name('staff.store');
});
