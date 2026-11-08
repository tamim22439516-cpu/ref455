// Bangladesh 64 Districts & Thanas Dataset with Bilingual (Bangla & English) Support

export interface LocationItem {
  nameBn: string;
  nameEn: string;
  aliases?: string[];
}

export const bdDistrictsList: LocationItem[] = [
  { nameBn: 'ঢাকা', nameEn: 'Dhaka', aliases: ['dhaka', 'dhk', 'dhaka city'] },
  { nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', aliases: ['chittagong', 'ctg', 'chattagram'] },
  { nameBn: 'গাজীপুর', nameEn: 'Gazipur', aliases: ['gazipur', 'gajipur'] },
  { nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj', aliases: ['narayanganj', 'narayongonj'] },
  { nameBn: 'কুমিল্লা', nameEn: 'Cumilla', aliases: ['comilla', 'cumilla'] },
  { nameBn: 'সিলেট', nameEn: 'Sylhet', aliases: ['sylhet', 'shilet'] },
  { nameBn: 'রাজশাহী', nameEn: 'Rajshahi', aliases: ['rajshahi', 'raj'] },
  { nameBn: 'বগুড়া', nameEn: 'Bogura', aliases: ['bogra', 'bogura'] },
  { nameBn: 'খুলনা', nameEn: 'Khulna', aliases: ['khulna'] },
  { nameBn: 'বরিশাল', nameEn: 'Barishal', aliases: ['barisal', 'barishal'] },
  { nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', aliases: ['mymensingh', 'moymonsingho'] },
  { nameBn: 'রংপুর', nameEn: 'Rangpur', aliases: ['rangpur'] },
  { nameBn: 'দিনাজপুর', nameEn: 'Dinajpur', aliases: ['dinajpur'] },
  { nameBn: 'যশোর', nameEn: 'Jashore', aliases: ['jessore', 'jashore'] },
  { nameBn: 'কক্সবাজার', nameEn: 'Cox\'s Bazar', aliases: ['coxsbazar', 'coxs bazar', 'koxbazar'] },
  { nameBn: 'ফেনী', nameEn: 'Feni', aliases: ['feni', 'pheni'] },
  { nameBn: 'নোয়াখালী', nameEn: 'Noakhali', aliases: ['noakhali'] },
  { nameBn: 'পাবনা', nameEn: 'Pabna', aliases: ['pabna'] },
  { nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj', aliases: ['kishoreganj', 'kishorganj'] },
  { nameBn: 'চাঁদপুর', nameEn: 'Chandpur', aliases: ['chandpur'] },
  { nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria', aliases: ['brahmanbaria', 'b.baria'] },
  { nameBn: 'টাঙ্গাইল', nameEn: 'Tangail', aliases: ['tangail'] },
  { nameBn: 'কুষ্টিয়া', nameEn: 'Kushtia', aliases: ['kushtia', 'kustia'] },
  { nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali', aliases: ['patuakhali'] },
  { nameBn: 'সিরাজগঞ্জ', nameEn: 'Sirajganj', aliases: ['sirajganj', 'sirajgonj'] },
  { nameBn: 'ফরিদপুর', nameEn: 'Faridpur', aliases: ['faridpur'] },
  { nameBn: 'শেরপুর', nameEn: 'Sherpur', aliases: ['sherpur'] },
  { nameBn: 'জামালপুর', nameEn: 'Jamalpur', aliases: ['jamalpur'] },
  { nameBn: 'নেত্রকোনা', nameEn: 'Netrokona', aliases: ['netrokona', 'netrakona'] },
  { nameBn: 'গোপালগঞ্জ', nameEn: 'Gopalganj', aliases: ['gopalganj', 'gopalgonj'] },
  { nameBn: 'মাদারীপুর', nameEn: 'Madaripur', aliases: ['madaripur'] },
  { nameBn: 'শরীয়তপুর', nameEn: 'Shariatpur', aliases: ['shariatpur'] },
  { nameBn: 'মানিকগঞ্জ', nameEn: 'Manikganj', aliases: ['manikganj', 'manikgonj'] },
  { nameBn: 'মুন্সীগঞ্জ', nameEn: 'Munshiganj', aliases: ['munshiganj', 'munshigonj'] },
  { nameBn: 'নরসিংদী', nameEn: 'Narsingdi', aliases: ['narsingdi'] },
  { nameBn: 'লক্ষ্মীপুর', nameEn: 'Lakshmipur', aliases: ['lakshmipur', 'laxmipur'] },
  { nameBn: 'রাজবাড়ী', nameEn: 'Rajbari', aliases: ['rajbari'] },
  { nameBn: 'সাতক্ষীরা', nameEn: 'Satkhira', aliases: ['satkhira'] },
  { nameBn: 'ঝিনাইদহ', nameEn: 'Jhenaidah', aliases: ['jhenaidah', 'jhenaidaha'] },
  { nameBn: 'চুয়াডাঙ্গা', nameEn: 'Chuadanga', aliases: ['chuadanga'] },
  { nameBn: 'মেহেরপুর', nameEn: 'Meherpur', aliases: ['meherpur'] },
  { nameBn: 'নড়াইল', nameEn: 'Narail', aliases: ['narail'] },
  { nameBn: 'মাগুরা', nameEn: 'Magura', aliases: ['magura'] },
  { nameBn: 'বাগেরহাট', nameEn: 'Bagerhat', aliases: ['bagerhat'] },
  { nameBn: 'ঝালকাঠি', nameEn: 'Jhalokathi', aliases: ['jhalokathi', 'jhalakati'] },
  { nameBn: 'পিরোজপুর', nameEn: 'Pirojpur', aliases: ['pirojpur'] },
  { nameBn: 'বরগুনা', nameEn: 'Barguna', aliases: ['barguna'] },
  { nameBn: 'ভোলা', nameEn: 'Bhola', aliases: ['bhola'] },
  { nameBn: 'জয়পুরহাট', nameEn: 'Joypurhat', aliases: ['joypurhat'] },
  { nameBn: 'নওগাঁ', nameEn: 'Naogaon', aliases: ['naogaon', 'nawgaon'] },
  { nameBn: 'নাটোর', nameEn: 'Natore', aliases: ['natore'] },
  { nameBn: 'চাঁপাইনবাবগঞ্জ', nameEn: 'Chapainawabganj', aliases: ['chapainawabganj', 'nawabganj'] },
  { nameBn: 'কুড়িগ্রাম', nameEn: 'Kurigram', aliases: ['kurigram'] },
  { nameBn: 'গাইবান্ধা', nameEn: 'Gaibandha', aliases: ['gaibandha'] },
  { nameBn: 'নীলফামারী', nameEn: 'Nilphamari', aliases: ['nilphamari'] },
  { nameBn: 'পঞ্চগড়', nameEn: 'Panchagarh', aliases: ['panchagarh'] },
  { nameBn: 'ঠাকুরগাঁও', nameEn: 'Thakurgaon', aliases: ['thakurgaon'] },
  { nameBn: 'হবিগঞ্জ', nameEn: 'Habiganj', aliases: ['habiganj'] },
  { nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar', aliases: ['moulvibazar', 'moulvibazar'] },
  { nameBn: 'সুনামগঞ্জ', nameEn: 'Sunamganj', aliases: ['sunamganj'] },
  { nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', aliases: ['khagrachhari', 'khagrachari'] },
  { nameBn: 'রাঙ্গামাটি', nameEn: 'Rangamati', aliases: ['rangamati'] },
  { nameBn: 'বান্দরবান', nameEn: 'Bandarban', aliases: ['bandarban'] },
  { nameBn: 'লালমনিরহাট', nameEn: 'Lalmonirhat', aliases: ['lalmonirhat', 'lalmoni'] },
];

export const bdDistrictsAndThanas: Record<string, string[]> = {
  'লালমনিরহাট': ['হাতিবান্ধা', 'পাটগ্রাম', 'কালীগঞ্জ', 'আদিতমারী', 'লালমনিরহাট সদর'],
  'রংপুর': ['রংপুর সদর', 'পীরগঞ্জ', 'মিঠাপুকুর', 'কাউনিয়া', 'পীরগাছা', 'বদরগঞ্জ', 'গঙ্গাচড়া', 'তারাগঞ্জ'],
  'ঢাকা': ['ধানমন্ডি', 'গুলশান', 'মিরপুর', 'উত্তরা', 'মোহাম্মদপুর', 'সাভার', 'ধামরাই', 'কেরানীগঞ্জ', 'নবাবগঞ্জ', 'দোহার', 'যাত্রাবাড়ী', 'বাড্ডা', 'বসুন্ধরা', 'শাহবাগ', 'মতিঝিল', 'তেজগাঁও', 'বনানী', 'খিলগাঁও', 'রামপুরা', 'পল্লবী', 'কাফরুল', 'লালবাগ', 'হাজারীবাগ', 'নিউ মার্কেট', 'ক্যান্টনমেন্ট'],
  'চট্টগ্রাম': ['চট্টগ্রাম সদর', 'কোতোয়ালী', 'পাঁচলাইশ', 'পাহাড়তলী', 'হালিশহর', 'পতেঙ্গা', 'পটিয়া', 'হাটহাজারী', 'সীতাকুণ্ড', 'মিরসরাই', 'রাউজান', 'রাঙ্গুনিয়া', 'বোয়ালখালী', 'বাঁশখালী', 'আনোয়ারা', 'সন্দ্বীপ', 'ফটিকছড়ি', 'চকোরিয়া', 'লোহাগাড়া', 'সাতকানিয়া'],
  'গাজীপুর': ['গাজীপুর সদর', 'কালিয়াকৈর', 'শ্রীপুর', 'কাপাসিয়া', 'কালীগঞ্জ', 'টঙ্গী'],
  'নারায়ণগঞ্জ': ['নারায়ণগঞ্জ সদর', 'সিদ্ধিরগঞ্জ', 'রূপগঞ্জ', 'আড়াইহাজার', 'সোনারগাঁও', 'বন্দর', 'ফতুল্লা'],
  'কুমিল্লা': ['কুমিল্লা সদর', 'লাকসাম', 'দাউদকান্দি', 'চৌদ্দগ্রাম', 'দেবীদ্বার', 'মুরাদনগর', 'হোমনা', 'তিতাস', 'বরুড়া', 'মনোহরগঞ্জ', 'ব্রাহ্মণপাড়া', 'বুড়িচং', 'চান্দিনা'],
  'বগুড়া': ['বগুড়া সদর', 'শেরপুর', 'শিবগঞ্জ', 'ধুনট', 'গাবতলী', 'নন্দীগ্রাম', 'কাহালু', 'দুপচাঁচিয়া', 'আদমদীঘি', 'শাজাহানপুর', 'সারিয়াকান্দি', 'সোনাতলা'],
  'সিলেট': ['সিলেট সদর', 'গোলাপগঞ্জ', 'বিয়ানীবাজার', 'জৈন্তাপুর', 'কানাইঘাট', 'কোম্পানীগঞ্জ', 'গোয়াইনঘাট', 'জকিগঞ্জ', 'ফেঞ্চুগঞ্জ', 'দক্ষিণ সুরমা', 'বালাগঞ্জ', 'বিশ্বনাথ', 'ওসমানীনগর'],
  'রাজশাহী': ['রাজশাহী সদর', 'পবা', 'গোদাগাড়ী', 'তানোর', 'মোহনপুর', 'বাগমারা', 'দুর্গাপুর', 'চারঘাট', 'বাঘা', 'পুঠিয়া'],
  'খুলনা': ['খুলনা সদর', 'রূপসা', 'তেরখাদা', 'দিঘলিয়া', 'ফুলতলা', 'বটিয়াঘাটা', 'ডুমুরিয়া', 'পাইকগাছা', 'কয়রা', 'দাকোপ', 'খালিশপুর', 'দৌলতপুর', 'সোনাডাঙ্গা'],
  'বরিশাল': ['বরিশাল সদর', 'বাকেরগঞ্জ', 'বাবুগঞ্জ', 'উজিরপুর', 'গৌরনদী', 'আগৈলঝাড়া', 'মেহেন্দিগঞ্জ', 'মুলাদী', 'হিজলা', 'বানারীপাড়া'],
  'ময়মনসিংহ': ['ময়মনসিংহ সদর', 'মুক্তাগাছা', 'ত্রিশাল', 'ভালুকা', 'ফুলবাড়িয়া', 'গফরগাঁও', 'নান্দাইল', 'ঈশ্বরগঞ্জ', 'ধোবাউড়া', 'হালুয়াঘাট', 'ফুলপুর', 'তারাকান্দা'],
  'দিনাজপুর': ['দিনাজপুর সদর', 'বিরামপুর', 'ফুলবাড়ী', 'পার্বতীপুর', 'বীরগঞ্জ', 'কাহারোল', 'বোচাগঞ্জ', 'চিরিরবন্দর', 'হাকিমপুর', 'নবাবগঞ্জ', 'ঘোড়াঘাট', 'খানসামা'],
  'যশোর': ['যশোর সদর', 'ঝিকরগাছা', 'শার্শা', 'চৌগাছা', 'নওয়াপাড়া', 'মণিরামপুর', 'কেশবপুর', 'বাঘারপাড়া', 'অভয়নগর'],
  'ফেনী': ['ফেনী সদর', 'দাগনভূঞা', 'ছাগলনাইয়া', 'পরশুরাম', 'ফুলগাজী', 'সোনাগাজী'],
  'নোয়াখালী': ['নোয়াখালী সদর', 'বেগমগঞ্জ', 'চাটখিল', 'সেনবাগ', 'কোম্পানীগঞ্জ', 'হাতিয়া', 'কবীরহাট', 'সোনাইমুড়ী', 'সুবর্ণচর'],
  'পাবনা': ['পাবনা সদর', 'ঈশ্বরদী', 'আটঘরিয়া', 'চাটমোহর', 'ভাঙ্গুড়া', 'ফরিদপুর', 'সুজানগর', 'সাঁথিয়া', 'বেড়া'],
  'কিশোরগঞ্জ': ['কিশোরগঞ্জ সদর', 'ভৈরব', 'বাজিতপুর', 'হোসেনপুর', 'কটিয়াদী', 'পাকুন্দিয়া', 'করিমগঞ্জ', 'তাড়াইল', 'ইটনা', 'মিঠামইন', 'অষ্টগ্রাম', 'নিকলী', 'কুলিয়ারচর'],
  'চাঁদপুর': ['চাঁদপুর সদর', 'হাজীগঞ্জ', 'শাহরাস্তি', 'কচুয়া', 'মতলব উত্তর', 'মতলব দক্ষিণ', 'ফরিদগঞ্জ', 'হাইমচর'],
  'ব্রাহ্মণবাড়িয়া': ['ব্রাহ্মণবাড়িয়া সদর', 'আশুগঞ্জ', 'সরাইল', 'নাসিরনগর', 'নবীনগর', 'বাঞ্ছারামপুর', 'কসবা', 'আখাউড়া', 'বিজয়নগর'],
  'টাঙ্গাইল': ['টাঙ্গাইল সদর', 'মির্জাপুর', 'কালিহাতী', 'ঘাটাইল', 'সখীপুর', 'বাসাইল', 'গোপালপুর', 'মধুপুর', 'ধনবাড়ী', 'ভূয়াপুর', 'নাগরপুর', 'দেলদুয়ার'],
  'কুষ্টিয়া': ['কুষ্টিয়া সদর', 'কুমারখালী', 'খোকসা', 'মিরপুর', 'ভেড়ামারা', 'দৌলতপুর'],
  'পটুয়াখালী': ['পটুয়াখালী সদর', 'গলাচিপা', 'দশমিনা', 'বাউফল', 'মির্জাগঞ্জ', 'দুমকী', 'কলাপাড়া', 'রাঙ্গাবালী'],
  'কক্সবাজার': ['কক্সবাজার সদর', 'রামু', 'চকোরিয়া', 'টেকনাফ', 'উখিয়া', 'পেকুয়া', 'মহেশখালী', 'কুতুবদিয়া'],
  'সিরাজগঞ্জ': ['সিরাজগঞ্জ সদর', 'শাহজাদপুর', 'উল্লাপাড়া', 'বেলকুচি', 'কামারখন্দ', 'কাজিপুর', 'রায়গঞ্জ', 'তাড়াশ', 'চৌহালী'],
  'ফরিদপুর': ['ফরিদপুর সদর', 'ভাঙ্গা', 'বোয়ালমারী', 'মধুখালী', 'নগরকান্দা', 'আলফাডাঙ্গা', 'সালথা', 'চরভদ্রাসন', 'সদরপুর'],
  'শেরপুর': ['শেরপুর সদর', 'নকলা', 'নালীতাবাড়ী', 'শ্রীবরদী', 'ঝিনাইগাতী'],
  'জামালপুর': ['জামালপুর সদর', 'সরিষাবাড়ী', 'মেলান্দহ', 'ইসলামপুর', 'দেওয়ানগঞ্জ', 'বক্সীগঞ্জ', 'মাদারগঞ্জ'],
  'নেত্রকোনা': ['নেত্রকোনা সদর', 'পূর্বধলা', 'দুর্গাপুর', 'কলমাকান্দা', 'সুসং', 'বারহাট্টা', 'আটপাড়া', 'কেন্দুয়া', 'মদন', 'খালিয়াজুরী', 'মোহনগঞ্জ'],
  'গোপালগঞ্জ': ['গোপালগঞ্জ সদর', 'মুকসুদপুর', 'কাশিয়ানী', 'কোটালীপাড়া', 'টুঙ্গিপাড়া'],
  'মাদারীপুর': ['মাদারীপুর সদর', 'শিবচর', 'কালকিনি', 'রাজৈর'],
  'শরীয়তপুর': ['শরীয়তপুর সদর', 'জাজিরা', 'নড়িয়া', 'ভেদরগঞ্জ', 'ডামুড্যা', 'গোসাইরহাট'],
  'মানিকগঞ্জ': ['মানিকগঞ্জ সদর', 'সিংগাইর', 'সাটুরিয়া', 'ঘিওর', 'দৌলতপুর', 'শিবালয়', 'হরিরামপুর'],
  'মুন্সীগঞ্জ': ['মুন্সীগঞ্জ সদর', 'শ্রীনগর', 'সিরাজদিখান', 'লৌহজং', 'টঙ্গীবাড়ী', 'গজারিয়া'],
  'নরসিংদী': ['নরসিংদী সদর', 'পলাশ', 'রায়পুরা', 'মনোহরদী', 'বেলাবো', 'শিবপুর'],
  'লক্ষ্মীপুর': ['লক্ষ্মীপুর সদর', 'রায়পুর', 'রামগঞ্জ', 'রামগতি', 'কমলনগর'],
  'রাজবাড়ী': ['রাজবাড়ী সদর', 'পাংশা', 'কালুখালী', 'বালিয়াকান্দি', 'গোয়ালন্দ'],
  'সাতক্ষীরা': ['সাতক্ষীরা সদর', 'কলারোয়া', 'তালা', 'দেবহাটা', 'কালীগঞ্জ', 'আশাশুনি', 'শ্যামনগর'],
  'ঝিনাইদহ': ['ঝিনাইদহ সদর', 'কালীগঞ্জ', 'শৈলকুপা', 'হরিণাকুণ্ডু', 'কোটচাঁদপুর', 'মহেশপুর'],
  'চুয়াডাঙ্গা': ['চুয়াডাঙ্গা সদর', 'আলমডাঙ্গা', 'দামুড়হুদা', 'জীবননগর'],
  'মেহেরপুর': ['মেহেরপুর সদর', 'মুজিবনগর', 'গাংনী'],
  'নড়াইল': ['নড়াইল সদর', 'লোহাগড়া', 'কালিয়া'],
  'মাগুরা': ['মাগুরা সদর', 'শ্রীপুর', 'মহম্মদপুর', 'শালিখা'],
  'বাগেরহাট': ['বাগেরহাট সদর', 'ফকিরহাট', 'মোল্লাহাট', 'চিতলমারী', 'কচুয়া', 'রামপাল', 'মংলা', 'মোরেলগঞ্জ', 'শরণখোলা'],
  'ঝালকাঠি': ['ঝালকাঠি সদর', 'নলছিটি', 'রাজাপুর', 'কাঠালিয়া'],
  'পিরোজপুর': ['পিরোজপুর সদর', 'ভাণ্ডারিয়া', 'মঠবাড়িয়া', 'নেছারাবাদ', 'নাজিরপুর', 'কাউখালী', 'ইন্দুরকানী'],
  'বরগুনা': ['বরগুনা সদর', 'আমতলী', 'পাথরঘাটা', 'বেতাগী', 'বামনা', 'তালতলী'],
  'ভোলা': ['ভোলা সদর', 'দৌলতখান', 'বোরহানউদ্দিন', 'তজুমদ্দিন', 'লালমোহন', 'চরফ্যাশন', 'মনপুরা'],
  'জয়পুরহাট': ['জয়পুরহাট সদর', 'পাঁচবিবি', 'কালাই', 'ক্ষেতলাল', 'আক্কেলপুর'],
  'নওগাঁ': ['নওগাঁ সদর', 'মহাদেবপুর', 'মান্দা', 'বদলগাছী', 'পত্নীতলা', 'ধামইরহাট', 'পোরশা', 'সাপাহার', 'রানীনগর', 'আত্রাই', 'নিয়ামতপুর'],
  'নাটোর': ['নাটোর সদর', 'সিংড়া', 'বড়াইগ্রাম', 'গুরুদাসপুর', 'লালপুর', 'বাগাতিপাড়া', 'নলডাঙ্গা'],
  'চাঁপাইনবাবগঞ্জ': ['নবাবগঞ্জ সদর', 'শিবগঞ্জ', 'গোমস্তাপুর', 'নাচোল', 'ভোলাহাট'],
  'কুড়িগ্রাম': ['কুড়িগ্রাম সদর', 'নাগেশ্বরী', 'ভুরুঙ্গামারী', 'ফুলবাড়ী', 'রাজারহাট', 'উলিপুর', 'চিলমারী', 'রৌমারী', 'চর রাজিবপুর'],
  'গাইবান্ধা': ['গাইবান্ধা সদর', 'গোবিন্দগঞ্জ', 'সুন্দরগঞ্জ', 'সাদুল্লাপুর', 'পলাশবাড়ী', 'সাঘাটা', 'ফুলছড়ি'],
  'নীলফামারী': ['নীলফামারী সদর', 'সৈয়দপুর', 'ডিমলা', 'ডোমার', 'জলঢাকা', 'কিশোরগঞ্জ'],
  'পঞ্চগড়': ['পঞ্চগড় সদর', 'তেঁতুলিয়া', 'বোদা', 'দেবীগঞ্জ', 'আটোয়ারী'],
  'ঠাকুরগাঁও': ['ঠাকুরগাঁও সদর', 'পীরগঞ্জ', 'রাণীশংকৈল', 'বালিয়াডাঙ্গী', 'হরিপুর'],
  'হবিগঞ্জ': ['হবিগঞ্জ সদর', 'নবীগঞ্জ', 'বাহুবল', 'চুনারুঘাট', 'মাধবপুর', 'লাখাই', 'আজমিরীগঞ্জ', 'বানিয়াচং', 'শায়েস্তাগঞ্জ'],
  'মৌলভীবাজার': ['মৌলভীবাজার সদর', 'শ্রীমঙ্গল', 'কমলগঞ্জ', 'কুলাউড়া', 'বড়লেখা', 'জুড়ী', 'রাজনগর'],
  'সুনামগঞ্জ': ['সুনামগঞ্জ সদর', 'ছাতক', 'জগন্নাথপুর', 'দেরাই', 'শাল্লা', 'ধর্মপাশা', 'জামালগঞ্জ', 'তাহিরপুর', 'বিশ্বম্ভরপুর', 'দোয়ারাবাজার', 'শান্তিগঞ্জ'],
  'খাগড়াছড়ি': ['খাগড়াছড়ি সদর', 'দীঘিনালা', 'পানছড়ি', 'মহালছড়ি', 'মাটিরাঙ্গা', 'রামগড়', 'মানিকছড়ি', 'লক্ষ্মীছড়ি', 'গুইমারা'],
  'রাঙ্গামাটি': ['রাঙ্গামাটি সদর', 'কাপ্তাই', 'কাউখালী', 'বাঘাইছড়ি', 'বরকল', 'লংগদু', 'রাজস্থলী', 'জুরাছড়ি', 'বিলাইছড়ি', 'নানিয়ারচর'],
  'বান্দরবান': ['বান্দরবান সদর', 'রুমা', 'থানচি', 'লামা', 'আলীকদম', 'নাইক্ষ্যংছড়ি', 'রোয়াংছড়ি'],
};

// Common Thana English Transliteration Helper
const thanaEngMap: Record<string, string> = {
  'ধানমন্ডি': 'Dhanmondi',
  'গুলশান': 'Gulshan',
  'মিরপুর': 'Mirpur',
  'উত্তরা': 'Uttara',
  'মোহাম্মদপুর': 'Mohammadpur',
  'সাভার': 'Savar',
  'ধামরাই': 'Dhamrai',
  'কেরানীগঞ্জ': 'Keraniganj',
  'নবাবগঞ্জ': 'Nawabganj',
  'দোহার': 'Dohar',
  'যাত্রাবাড়ী': 'Jatrabari',
  'বাড্ডা': 'Badda',
  'বসুন্ধরা': 'Bashundhara',
  'শাহবাগ': 'Shahbagh',
  'মতিঝিল': 'Motijheel',
  'তেজগাঁও': 'Tejgaon',
  'বনানী': 'Banani',
  'খিলগাঁও': 'Khilgaon',
  'রামপুরা': 'Rampura',
  'পল্লবী': 'Pallabi',
  'কাফরুল': 'Kafrul',
  'লালবাগ': 'Lalbagh',
  'হাজারীবাগ': 'Hazaribagh',
  'নিউ মার্কেট': 'New Market',
  'ক্যান্টনমেন্ট': 'Cantonment',
  'টঙ্গী': 'Tongi',
  'কালিয়াকৈর': 'Kaliakair',
  'শ্রীপুর': 'Sreepur',
  'কাপাসিয়া': 'Kapasia',
  'সিদ্ধিরগঞ্জ': 'Siddhirganj',
  'রূপগঞ্জ': 'Rupganj',
  'আড়াইহাজার': 'Araihazar',
  'সোনারগাঁও': 'Sonargaon',
  'কোতোয়ালী': 'Kotwali',
  'পাঁচলাইশ': 'Panchlaish',
  'পাহাড়তলী': 'Pahartali',
  'হালিশহর': 'Halishahar',
  'পতেঙ্গা': 'Patenga',
  'পটিয়া': 'Patiya',
  'হাটহাজারী': 'Hathazari',
  'সীতাকুণ্ড': 'Sitakunda',
  'মিরসরাই': 'Mirsharai',
  'লাকসাম': 'Laksam',
  'দাউদকান্দি': 'Daudkandi',
  'চৌদ্দগ্রাম': 'Chauddagram',
  'শেরপুর': 'Sherpur',
  'শিবগঞ্জ': 'Shibganj',
  'গোলাপগঞ্জ': 'Golapganj',
  'বিয়ানীবাজার': 'Beanibazar',
  'পবা': 'Paba',
  'গোদাগাড়ী': 'Godagari',
  'রূপসা': 'Rupsha',
  'ডুমুরিয়া': 'Dumuria',
  'সৈয়দপুর': 'Saidpur',
  'শ্রীমঙ্গল': 'Sreemangal',
  'হাতিবান্ধা': 'Hatibandha',
  'পাটগ্রাম': 'Patgram',
  'কালীগঞ্জ': 'Kaliganj',
  'আদিতমারী': 'Aditmari',
  'টেকনাফ': 'Teknaf',
  'উখিয়া': 'Ukhiya',
  'পেকুয়া': 'Pekua',
  'মহেশখালী': 'Maheshkhali',
  'কুতুবদিয়া': 'Kutubdia',
  'রামু': 'Ramu',
  'চকোরিয়া': 'Chakaria',
  'বোয়ালখালী': 'Boalkhali',
  'বাঁশখালী': 'Banshkhali',
  'রাউজান': 'Raozan',
  'রাঙ্গুনিয়া': 'Rangunia',
  'ফটিকছড়ি': 'Fatikchhari',
  'সাতকানিয়া': 'Satkania',
  'লোহাগাড়া': 'Lohagara',
  'সন্দ্বীপ': 'Sandwip',
  'আনোয়ারা': 'Anwara',
  'পীরগঞ্জ': 'Pirganj',
  'পীরগাছা': 'Pirgachha',
  'বদরগঞ্জ': 'Badarganj',
  'মিঠাপুকুর': 'Mithapukur',
  'গঙ্গাচড়া': 'Gangachhara',
  'কাউনিয়া': 'Kaunia',
  'তারাগঞ্জ': 'Taraganj',
  'দেবীদ্বার': 'Debidwar',
  'মুরাদনগর': 'Muradnagar',
  'হোমনা': 'Homna',
  'তিতাস': 'Titas',
  'বরুড়া': 'Barura',
  'বুড়িচং': 'Burichang',
  'চান্দিনা': 'Chandina',
  'মনোহরগঞ্জ': 'Manoharganj',
  'ব্রাহ্মণপাড়া': 'Brahmanpara',
  'শিবপুর': 'Shibpur',
  'পলাশ': 'Palash',
  'রায়পুরা': 'Raipura',
  'মনোহরদী': 'Monohardi',
  'বেলাবো': 'Belabo',
  'নলছিটি': 'Nalchiti',
  'রাজাপুর': 'Rajapur',
  'কাঠালিয়া': 'Kathalia',
  'চরফ্যাশন': 'Char Fasson',
  'দৌলতখান': 'Daulatkhan',
  'বোরহানউদ্দিন': 'Borhanuddin',
  'তজুমদ্দিন': 'Tazumuddin',
  'লালমোহন': 'Lalmohan',
  'মনপুরা': 'Manpura',
  'সিংগাইর': 'Singair',
  'সাটুরিয়া': 'Saturia',
  'ঘিওর': 'Ghior',
  'শিবালয়': 'Shibalaya',
  'হরিরামপুর': 'Harirampur',
  'কমলগঞ্জ': 'Kamalganj',
  'কুলাউড়া': 'Kulaura',
  'বড়লেখা': 'Barlekha',
  'জুড়ী': 'Juri',
  'রাজনগর': 'Rajnagar',
};

// Phonetic Transliteration from Bangla to English for any Bangladesh Thana
export const transliterateBnToEn = (text: string): string => {
  if (!text) return '';
  if (text.endsWith(' সদর')) {
    return `${transliterateBnToEn(text.replace(/ সদর$/, ''))} Sadar`;
  }
  if (text.endsWith(' উত্তর')) {
    return `${transliterateBnToEn(text.replace(/ উত্তর$/, ''))} North`;
  }
  if (text.endsWith(' দক্ষিণ')) {
    return `${transliterateBnToEn(text.replace(/ দক্ষিণ$/, ''))} South`;
  }

  const vowelMap: Record<string, string> = {
    'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
    'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
    'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্': ''
  };

  const consMap: Record<string, string> = {
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n'
  };

  let result = '';
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (vowelMap[ch] !== undefined) {
      result += vowelMap[ch];
    } else if (consMap[ch] !== undefined) {
      result += consMap[ch];
      const next = chars[i + 1];
      if (!next || (vowelMap[next] === undefined && next !== '্')) {
        result += 'a';
      }
    } else {
      result += ch;
    }
  }

  return result
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
    .join(' ');
};

export const getThanaEnglish = (thanaBn: string): string => {
  if (thanaEngMap[thanaBn]) return thanaEngMap[thanaBn];
  if (thanaBn.endsWith(' সদর')) {
    const base = thanaBn.replace(/ সদর$/, '').trim();
    const dist = bdDistrictsList.find(d => d.nameBn === base);
    if (dist) return `${dist.nameEn} Sadar`;
    if (thanaEngMap[base]) return `${thanaEngMap[base]} Sadar`;
    return `${transliterateBnToEn(base)} Sadar`;
  }
  const dist = bdDistrictsList.find(d => d.nameBn === thanaBn);
  if (dist) return dist.nameEn;
  return transliterateBnToEn(thanaBn);
};

// Search Bilingual Districts (Matches Bangla and English)
export const searchBilingualDistricts = (query: string): Array<{ nameBn: string; nameEn: string; display: string }> => {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return bdDistrictsList.map(d => ({
      nameBn: d.nameBn,
      nameEn: d.nameEn,
      display: `${d.nameEn} (${d.nameBn})`
    }));
  }

  const results = bdDistrictsList.filter(d => {
    if (d.nameBn.toLowerCase().includes(q)) return true;
    if (d.nameEn.toLowerCase().includes(q)) return true;
    if (d.aliases && d.aliases.some(alias => alias.toLowerCase().includes(q))) return true;
    return false;
  });

  return results.map(d => ({
    nameBn: d.nameBn,
    nameEn: d.nameEn,
    display: `${d.nameEn} (${d.nameBn})`
  }));
};

// Search Bilingual Thanas for a district (or globally if no district provided)
export const searchBilingualThanas = (query: string, district?: string): Array<{ nameBn: string; nameEn: string; display: string }> => {
  const q = (query || '').trim().toLowerCase();

  // Find target district key
  let districtKey = '';
  if (district) {
    const cleanDist = district.replace(/\(.*\)/, '').trim().toLowerCase();
    const matched = bdDistrictsList.find(d => 
      d.nameBn.toLowerCase() === cleanDist ||
      d.nameEn.toLowerCase() === cleanDist ||
      (d.aliases && d.aliases.some(a => a.toLowerCase() === cleanDist))
    );
    if (matched) {
      districtKey = matched.nameBn;
    } else {
      districtKey = Object.keys(bdDistrictsAndThanas).find(k => k.toLowerCase() === cleanDist) || '';
    }
  }

  const thanaList: string[] = districtKey && bdDistrictsAndThanas[districtKey]
    ? bdDistrictsAndThanas[districtKey]
    : Object.values(bdDistrictsAndThanas).flat();

  // Deduplicate
  const uniqueThanas = Array.from(new Set(thanaList));

  const filtered = uniqueThanas.filter(thanaBn => {
    if (!q) return true;
    const thanaEn = getThanaEnglish(thanaBn);
    if (thanaBn.toLowerCase().includes(q)) return true;
    if (thanaEn.toLowerCase().includes(q)) return true;
    const cleanBn = thanaBn.replace(/\s+/g, '');
    const cleanEn = thanaEn.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanQ = q.replace(/[^a-z0-9\u0980-\u09FF]/gi, '');
    if (cleanEn.includes(cleanQ) || cleanBn.includes(cleanQ)) return true;
    return isSearchTextMatch(thanaBn, q);
  });

  return filtered.slice(0, 30).map(thanaBn => {
    const thanaEn = getThanaEnglish(thanaBn);
    const display = `${thanaEn} (${thanaBn})`;
    return {
      nameBn: thanaBn,
      nameEn: thanaEn,
      display
    };
  });
};

// English-Bangla Matcher Helper for backward compatibility
export const isSearchTextMatch = (banglaText: string, searchInput: string): boolean => {
  if (!searchInput.trim()) return true;
  const q = searchInput.trim().toLowerCase();

  // Direct Bangla match
  if (banglaText.toLowerCase().includes(q)) return true;

  // Direct District list check
  const matchedDist = bdDistrictsList.find(d => d.nameBn === banglaText);
  if (matchedDist) {
    if (matchedDist.nameEn.toLowerCase().includes(q)) return true;
    if (matchedDist.aliases && matchedDist.aliases.some(a => a.toLowerCase().includes(q))) return true;
  }

  // Thana map check
  const engThana = getThanaEnglish(banglaText);
  if (engThana && engThana.toLowerCase().includes(q)) return true;

  return false;
};
