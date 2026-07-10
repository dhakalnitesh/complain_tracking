<?php

namespace Tests\Unit;

use App\Services\BsDateService;
use Carbon\Carbon;
use Tests\TestCase;

class BsDateServiceTest extends TestCase
{
    public function test_converts_known_ad_date_to_bs(): void
    {
        $date = Carbon::create(2024, 4, 13, 0, 0, 0);
        $bs = BsDateService::toBs($date);

        $this->assertEquals(2081, $bs['year']);
        $this->assertEquals(1, $bs['month']);
        $this->assertEquals(1, $bs['day']);
    }

    public function test_converts_mid_year_ad_to_bs(): void
    {
        $date = Carbon::create(2026, 10, 15, 0, 0, 0);
        $bs = BsDateService::toBs($date);

        $this->assertEquals(2083, $bs['year']);
        $this->assertGreaterThanOrEqual(4, $bs['month']);
        $this->assertLessThanOrEqual(12, $bs['month']);
    }

    public function test_returns_nepali_numbers(): void
    {
        $result = BsDateService::toNepaliNum(2081);
        $this->assertEquals('२०८१', $result);
    }

    public function test_to_bs_string_returns_short_format(): void
    {
        $date = Carbon::create(2024, 4, 13, 0, 0, 0);
        $result = BsDateService::toBsString($date, 'short');

        $this->assertStringContainsString('2081', $result);
        $this->assertStringContainsString('-01-01', $result);
    }

    public function test_to_bs_string_returns_full_date_format(): void
    {
        $date = Carbon::create(2024, 4, 13, 0, 0, 0);
        $result = BsDateService::toBsString($date, 'date');

        $this->assertStringContainsString('साल', $result);
        $this->assertStringContainsString('गते', $result);
    }

    public function test_to_bs_string_returns_datetime_format(): void
    {
        $date = Carbon::create(2024, 4, 13, 10, 30, 0);
        $result = BsDateService::toBsString($date, 'datetime');

        $this->assertStringContainsString('बजे', $result);
    }

    public function test_get_month_name_np_returns_correct_name(): void
    {
        $this->assertEquals('बैशाख', BsDateService::getMonthNameNp(1));
        $this->assertEquals('जेठ', BsDateService::getMonthNameNp(2));
        $this->assertEquals('चैत्र', BsDateService::getMonthNameNp(12));
    }
}
