<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Issue;
use App\Models\IssueEvent;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // === CATEGORIES ===
        $categoryOrder = [
            'Canteen/Food', 'Toilet/Sanitation', 'Furniture/Equipment',
            'Projector/Board', 'Library', 'Class Scheduling', 'Exam Concern',
            'Admin/Account Delay', 'Cleanliness', 'Electricity/Water',
            'Safety/Security', 'Harassment', 'Road/Infrastructure',
            'Health/Medical', 'Other',
        ];
        $categoryMap = [];
        foreach ($categoryOrder as $i => $name) {
            $cat = Category::create(['name' => $name, 'sort_order' => $i, 'is_active' => true]);
            $categoryMap[$name] = $cat->id;
        }

        // === REAL NEPAL ORGANIZATIONS ===
        $education = Organization::create([
            'name' => 'Tribhuvan University',
            'slug' => 'tribhuvan-university',
            'type' => 'educational',
            'address' => 'Kirtipur, Kathmandu',
            'phone' => '01-4331322',
            'email' => 'info@tribhuvan.edu.np',
            'description' => 'The oldest and largest public university of Nepal, established in 1959.',
            'is_active' => true,
        ]);

        $municipality = Organization::create([
            'name' => 'Kathmandu Metropolitan City',
            'slug' => 'kathmandu-metropolitan',
            'type' => 'municipality',
            'address' => 'Kathmandu Durbar Square, Basantapur',
            'phone' => '01-4231300',
            'email' => 'info@kathmandu.gov.np',
            'description' => 'The metropolitan city government of Kathmandu, serving over 1 million citizens.',
            'is_active' => true,
        ]);

        $hospital = Organization::create([
            'name' => 'Bir Hospital',
            'slug' => 'bir-hospital',
            'type' => 'hospital',
            'address' => 'Maitighar, Kathmandu',
            'phone' => '01-4221119',
            'email' => 'info@birhospital.gov.np',
            'description' => 'The oldest hospital in Nepal, established in 1889. A central government hospital.',
            'is_active' => true,
        ]);

        $govt = Organization::create([
            'name' => 'Department of Passports',
            'slug' => 'department-of-passports',
            'type' => 'government',
            'address' => 'Tripureshwor, Kathmandu',
            'phone' => '01-4211500',
            'email' => 'info@passport.gov.np',
            'description' => 'Government department responsible for passport issuance and management.',
            'is_active' => true,
        ]);

        // === CREATE USERS ===
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@nagariksarokar.com',
            'password' => Hash::make('admin123'),
            'is_admin' => true,
        ]);

        $tuAdmin = User::create([
            'name' => 'TU Admin',
            'email' => 'tu@nagariksarokar.com',
            'password' => Hash::make('password'),
            'organization_id' => $education->id,
        ]);

        // === LOCATIONS ===
        // TU Locations
        $tuParents = ['Kirtipur Main Campus', 'Patan Campus', 'Mechi Campus', 'Central Library'];
        foreach ($tuParents as $name) {
            Location::create(['name' => $name, 'organization_id' => $education->id]);
        }
        $kirtipur = Location::where('name', 'Kirtipur Main Campus')->first();
        foreach (['Science Block', 'Management Block', 'Humanities Block', 'Admin Building', 'Boys Hostel', 'Girls Hostel', 'Canteen', 'Lab'] as $child) {
            Location::create(['name' => $child, 'parent_id' => $kirtipur->id, 'organization_id' => $education->id]);
        }

        // KMC Locations (wards)
        $wardNames = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10'];
        $kmcOffices = ['Nagarkot', 'Basantapur', 'Baneshwor', 'Kalimati', 'Thamel', 'Gaushala', 'Chabahil', 'Bouddha', 'Balaju', 'Swayambhu'];
        foreach ($wardNames as $i => $ward) {
            $loc = Location::create(['name' => $ward . ' - ' . $kmcOffices[$i], 'organization_id' => $municipality->id]);
            Location::create(['name' => $ward . ' Ward Office', 'parent_id' => $loc->id, 'organization_id' => $municipality->id]);
        }

        // Bir Hospital Locations
        foreach (['Emergency Ward', 'OPD Block', 'Pharmacy', 'Lab', 'Admin Section', 'Inpatient Ward A', 'Inpatient Ward B'] as $name) {
            Location::create(['name' => $name, 'organization_id' => $hospital->id]);
        }

        // Passport Office Locations
        foreach (['Ground Floor (Application)', 'First Floor (Verification)', 'Second Floor (Photography)', 'Third Floor (Dispatch)', 'Payment Counter'] as $name) {
            Location::create(['name' => $name, 'organization_id' => $govt->id]);
        }

        // === REALISTIC ISSUES ===
        $orgIssues = [
            // TU Issues
            [
                'org' => $education,
                'location' => 'Boys Hostel',
                'category' => 'Electricity/Water',
                'priority' => 'critical',
                'description' => 'Hostel ma bihana 6 baja dekhi bihana 10 baja samma pani audaina. Dhune ra pina ko lagi dherai samasya bhayeko chha. 200 jana bidyarthi prabhavit bhayeka chhau.',
                'status' => 'received',
                'days_ago' => 2,
            ],
            [
                'org' => $education,
                'location' => 'Canteen',
                'category' => 'Canteen/Food',
                'priority' => 'high',
                'description' => 'Canteen ko khana ma ek hapta dekhi kira pareko paayeko chha. Ajha aaja bhat ma sano kira thiyo. Swasthya lai risk cha. Canteen bandha garnu parchha.',
                'status' => 'in_progress',
                'days_ago' => 5,
                'assigned_to' => 'Canteen Committee',
            ],
            [
                'org' => $education,
                'location' => 'Science Block',
                'category' => 'Toilet/Sanitation',
                'priority' => 'high',
                'description' => 'Science block ko girls washroom 3 din dekhi safa gariyeko chaina. Dustbin bhariyera khattam bhayeko chha. Durgandha sahanu nasaknu. Soap pani chaina.',
                'status' => 'received',
                'days_ago' => 3,
            ],
            [
                'org' => $education,
                'location' => 'Central Library',
                'category' => 'Cleanliness',
                'priority' => 'medium',
                'description' => 'Library ma dherai dhulo bhayeko chha. Bookshelf ma makhuro ko jalo lagyo. Safai garna dhyan dinu paryo. Bidyarthi basna nasakne.',
                'status' => 'received',
                'days_ago' => 10,
            ],
            [
                'org' => $education,
                'location' => 'Management Block',
                'category' => 'Furniture/Equipment',
                'priority' => 'medium',
                'description' => 'Management block ko katha 208 ma 20 ota kurchi bhachhaka chhan ra 5 ota table bigreka chhan. Bidyarthi le khada khada class linu parcha.',
                'status' => 'received',
                'days_ago' => 7,
            ],
            [
                'org' => $education,
                'location' => 'Admin Building',
                'category' => 'Admin/Account Delay',
                'priority' => 'high',
                'description' => 'Scholarship form bujhauna 3 hapta bhayo, tara account section le \'pachi aau\' bhandai pathairaheko chha. University ko deadline next week ho.',
                'status' => 'resolved',
                'days_ago' => 8,
                'resolved' => true,
            ],

            // KMC Issues
            [
                'org' => $municipality,
                'location' => 'Ward 3 - Baneshwor',
                'category' => 'Road/Infrastructure',
                'priority' => 'critical',
                'description' => 'Baneshwor ko main sadak ma thulo khaliyeko chha. Rateko pani le jammi gayeko chha. Sanjh 7 bajesi tyo bato hidna nasakne. Jyestha nagarik lai dherai samasya.',
                'status' => 'received',
                'days_ago' => 1,
            ],
            [
                'org' => $municipality,
                'location' => 'Ward 5 - Kalimati',
                'category' => 'Cleanliness',
                'priority' => 'high',
                'description' => 'Kalimati vegetable market ko fohor 4 din dekhi uthaeko chaina. Badbo aayera bhayena. Sarsari rog phailne khatra cha. Nagarik haru dherai chintit chhan.',
                'status' => 'received',
                'days_ago' => 4,
            ],
            [
                'org' => $municipality,
                'location' => 'Ward 8 - Bouddha',
                'category' => 'Safety/Security',
                'priority' => 'critical',
                'description' => 'Bouddha chowk ma raatiko samaya street light nabhayera anadhyaro hunchha. 2 hapta agadi euta mahila lai lutiye ko thiyo. Bato ta nahidna 9 baje pachi.',
                'status' => 'received',
                'days_ago' => 6,
            ],
            [
                'org' => $municipality,
                'location' => 'Ward 1 - Nagarkot',
                'category' => 'Electricity/Water',
                'priority' => 'high',
                'description' => 'Nagarkot ma 5 din dekhi pani ko dhara sukeko chha. Municipality tanker pani pathaeko chaina. Ghar ghar ma pani ko hahakar chha.',
                'status' => 'received',
                'days_ago' => 5,
            ],

            // Bir Hospital Issues
            [
                'org' => $hospital,
                'location' => 'Emergency Ward',
                'category' => 'Health/Medical',
                'priority' => 'critical',
                'description' => 'Emergency ma birami lai bed nabhayera floor ma rakhnu paryo. 3 din dekhiko patient lai ajhai treatment bhayeko chaina. Dr. ko sankhya pani paryapta chaina.',
                'status' => 'received',
                'days_ago' => 1,
            ],
            [
                'org' => $hospital,
                'location' => 'Pharmacy',
                'category' => 'Health/Medical',
                'priority' => 'high',
                'description' => 'Pharmacy ma aabasyak ausadhi haru stok chaina. Diabetes ra blood pressure ko medicine 1 hapta dekhi availability chaina. Birami lai bahira bata lyaunu parcha.',
                'status' => 'received',
                'days_ago' => 3,
            ],
            [
                'org' => $hospital,
                'location' => 'OPD Block',
                'category' => 'Admin/Account Delay',
                'priority' => 'high',
                'description' => 'OPD ma ticket lina 3 ghanta kuna lagcha. Tyo pani bihana 6 baje dekhi line basnu parcha. 75 barsa ko budo manchhe lai treatment bina farkinu paryo.',
                'status' => 'received',
                'days_ago' => 2,
            ],

            // Passport Office Issues
            [
                'org' => $govt,
                'location' => 'Ground Floor (Application)',
                'category' => 'Admin/Account Delay',
                'priority' => 'critical',
                'description' => 'Passport application lina 2 mahina bhayo. 3 patak office gayou tara "system bigreko cha, pheri au" bhanchha. Bidesh jane time bhayena. 10 lakh rupaiya ko ticket waste hune abastha.',
                'status' => 'in_progress',
                'days_ago' => 60,
                'assigned_to' => 'Senior Officer',
            ],
            [
                'org' => $govt,
                'location' => 'Third Floor (Dispatch)',
                'category' => 'Safety/Security',
                'priority' => 'high',
                'description' => 'Passport dispatch counter ma aafant le kam chalauxa bhanne aarop chha. Agent haru le paisa liyera passport chhito nikalne garne gareko chha. Anusandhan garnu parchha.',
                'status' => 'received',
                'days_ago' => 15,
            ],
        ];

        foreach ($orgIssues as $data) {
            $org = $data['org'];
            $loc = Location::where('name', $data['location'])->where('organization_id', $org->id)->first();
            if (!$loc) continue;

            $createdAt = now()->subDays($data['days_ago']);
            $catId = $categoryMap[$data['category']] ?? null;

            $issue = Issue::create([
                'organization_id' => $org->id,
                'category' => $data['category'],
                'category_id' => $catId,
                'priority' => $data['priority'],
                'location_id' => $loc->id,
                'description' => $data['description'],
                'status' => $data['status'],
                'assigned_to' => $data['assigned_to'] ?? null,
                'resolved_at' => isset($data['resolved']) ? $createdAt->copy()->addDays(3) : null,
                'is_anonymous' => true,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $id = $issue->id;
            $orgPrefix = match($org->id) {
                $education->id => 'TU',
                $municipality->id => 'KMC',
                $hospital->id => 'BIR',
                $govt->id => 'DOP',
                default => 'GRV'
            };
            $issue->update(['reference_code' => $orgPrefix . '-' . str_pad($id, 4, '0', STR_PAD_LEFT)]);

            IssueEvent::create([
                'issue_id' => $issue->id, 'type' => 'created',
                'description' => match($org->id) {
                    $municipality->id => 'उजुरी प्राप्त भयो। तपाईंको उजुरी सम्बन्धित वडा कार्यालयमा पठाइनेछ।',
                    $hospital->id => 'उजुरी प्राप्त भयो। स्वास्थ्य सम्बन्धी उजुरी तुरुन्त सम्बन्धित विभागमा पठाइनेछ।',
                    $govt->id => 'उजुरी प्राप्त भयो। यो उजुरी सम्बन्धित शाखामा पठाइनेछ।',
                    default => 'उजुरी सफलतापूर्वक पेश भयो।',
                },
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            if ($issue->status === 'in_progress') {
                IssueEvent::create([
                    'issue_id' => $issue->id, 'type' => 'status_changed',
                    'description' => match($org->id) {
                        $education->id => 'तपाईंको उजुरी प्रक्रियामा गइसकेको छ। यसलाई सम्बन्धित समितिले हेरिरहेको छ।',
                        default => 'उजुरी प्रक्रियामा गएको छ।',
                    },
                    'created_at' => $createdAt->copy()->addDay(),
                    'updated_at' => $createdAt->copy()->addDay(),
                ]);
            }

            if ($issue->status === 'resolved') {
                IssueEvent::create([
                    'issue_id' => $issue->id, 'type' => 'resolved',
                    'description' => match($org->id) {
                        $education->id => 'तपाईंको उजुरी समाधान भएको छ। कृपया Santushti मूल्याङ्कन दिनुहोस्।',
                        default => 'उजुरी समाधान भयो।',
                    },
                    'created_at' => $createdAt->copy()->addDays(3),
                    'updated_at' => $createdAt->copy()->addDays(3),
                ]);
                $issue->update(['rating' => rand(3,5), 'feedback_comment' => 'धन्यवाद! समस्या समाधान भयो।']);
            }
        }
    }
}
