 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 // Romanian counties with codes
 const COUNTIES: Record<string, string> = {
   'AB': 'Alba', 'AR': 'Arad', 'AG': 'Argeș', 'BC': 'Bacău', 'BH': 'Bihor',
   'BN': 'Bistrița-Năsăud', 'BT': 'Botoșani', 'BR': 'Brăila', 'BV': 'Brașov',
   'B': 'București', 'BZ': 'Buzău', 'CL': 'Călărași', 'CS': 'Caraș-Severin',
   'CJ': 'Cluj', 'CT': 'Constanța', 'CV': 'Covasna', 'DB': 'Dâmbovița',
   'DJ': 'Dolj', 'GL': 'Galați', 'GR': 'Giurgiu', 'GJ': 'Gorj', 'HR': 'Harghita',
   'HD': 'Hunedoara', 'IL': 'Ialomița', 'IS': 'Iași', 'IF': 'Ilfov',
   'MM': 'Maramureș', 'MH': 'Mehedinți', 'MS': 'Mureș', 'NT': 'Neamț',
   'OT': 'Olt', 'PH': 'Prahova', 'SJ': 'Sălaj', 'SM': 'Satu Mare', 'SB': 'Sibiu',
   'SV': 'Suceava', 'TR': 'Teleorman', 'TM': 'Timiș', 'TL': 'Tulcea',
   'VL': 'Vâlcea', 'VS': 'Vaslui', 'VN': 'Vrancea'
 };
 
 // Complete Romania localities data (simplified for demo - in production use full GeoNames dump)
 const MAJOR_LOCALITIES = [
   // București
   { name: "București", name_ascii: "Bucuresti", county: "București", county_code: "B", locality_type: "municipiu", population: 1883425, latitude: 44.4268, longitude: 26.1025, is_county_seat: true },
   // Sector 1-6
   { name: "Sector 1", name_ascii: "Sector 1", county: "București", county_code: "B", locality_type: "sector", population: 227240, latitude: 44.4600, longitude: 26.0700, is_county_seat: false },
   { name: "Sector 2", name_ascii: "Sector 2", county: "București", county_code: "B", locality_type: "sector", population: 357338, latitude: 44.4450, longitude: 26.1300, is_county_seat: false },
   { name: "Sector 3", name_ascii: "Sector 3", county: "București", county_code: "B", locality_type: "sector", population: 403894, latitude: 44.4200, longitude: 26.1500, is_county_seat: false },
   { name: "Sector 4", name_ascii: "Sector 4", county: "București", county_code: "B", locality_type: "sector", population: 290789, latitude: 44.4000, longitude: 26.1000, is_county_seat: false },
   { name: "Sector 5", name_ascii: "Sector 5", county: "București", county_code: "B", locality_type: "sector", population: 282176, latitude: 44.4100, longitude: 26.0700, is_county_seat: false },
   { name: "Sector 6", name_ascii: "Sector 6", county: "București", county_code: "B", locality_type: "sector", population: 371988, latitude: 44.4350, longitude: 26.0300, is_county_seat: false },
   // Major cities
   { name: "Cluj-Napoca", name_ascii: "Cluj-Napoca", county: "Cluj", county_code: "CJ", locality_type: "municipiu", population: 324576, latitude: 46.7712, longitude: 23.6236, is_county_seat: true },
   { name: "Timișoara", name_ascii: "Timisoara", county: "Timiș", county_code: "TM", locality_type: "municipiu", population: 319279, latitude: 45.7489, longitude: 21.2087, is_county_seat: true },
   { name: "Iași", name_ascii: "Iasi", county: "Iași", county_code: "IS", locality_type: "municipiu", population: 290422, latitude: 47.1585, longitude: 27.6014, is_county_seat: true },
   { name: "Constanța", name_ascii: "Constanta", county: "Constanța", county_code: "CT", locality_type: "municipiu", population: 283872, latitude: 44.1598, longitude: 28.6348, is_county_seat: true },
   { name: "Craiova", name_ascii: "Craiova", county: "Dolj", county_code: "DJ", locality_type: "municipiu", population: 269506, latitude: 44.3302, longitude: 23.7949, is_county_seat: true },
   { name: "Brașov", name_ascii: "Brasov", county: "Brașov", county_code: "BV", locality_type: "municipiu", population: 253200, latitude: 45.6579, longitude: 25.6012, is_county_seat: true },
   { name: "Galați", name_ascii: "Galati", county: "Galați", county_code: "GL", locality_type: "municipiu", population: 249432, latitude: 45.4353, longitude: 28.0080, is_county_seat: true },
   { name: "Ploiești", name_ascii: "Ploiesti", county: "Prahova", county_code: "PH", locality_type: "municipiu", population: 209945, latitude: 44.9365, longitude: 26.0135, is_county_seat: true },
   { name: "Oradea", name_ascii: "Oradea", county: "Bihor", county_code: "BH", locality_type: "municipiu", population: 196367, latitude: 47.0458, longitude: 21.9189, is_county_seat: true },
   { name: "Brăila", name_ascii: "Braila", county: "Brăila", county_code: "BR", locality_type: "municipiu", population: 180302, latitude: 45.2692, longitude: 27.9575, is_county_seat: true },
   { name: "Arad", name_ascii: "Arad", county: "Arad", county_code: "AR", locality_type: "municipiu", population: 159074, latitude: 46.1866, longitude: 21.3123, is_county_seat: true },
   { name: "Pitești", name_ascii: "Pitesti", county: "Argeș", county_code: "AG", locality_type: "municipiu", population: 155383, latitude: 44.8565, longitude: 24.8692, is_county_seat: true },
   { name: "Sibiu", name_ascii: "Sibiu", county: "Sibiu", county_code: "SB", locality_type: "municipiu", population: 147245, latitude: 45.7929, longitude: 24.1519, is_county_seat: true },
   { name: "Bacău", name_ascii: "Bacau", county: "Bacău", county_code: "BC", locality_type: "municipiu", population: 144307, latitude: 46.5670, longitude: 26.9146, is_county_seat: true },
   { name: "Târgu Mureș", name_ascii: "Targu Mures", county: "Mureș", county_code: "MS", locality_type: "municipiu", population: 134290, latitude: 46.5456, longitude: 24.5584, is_county_seat: true },
   { name: "Baia Mare", name_ascii: "Baia Mare", county: "Maramureș", county_code: "MM", locality_type: "municipiu", population: 123738, latitude: 47.6567, longitude: 23.5850, is_county_seat: true },
   { name: "Buzău", name_ascii: "Buzau", county: "Buzău", county_code: "BZ", locality_type: "municipiu", population: 115494, latitude: 45.1500, longitude: 26.8333, is_county_seat: true },
   { name: "Botoșani", name_ascii: "Botosani", county: "Botoșani", county_code: "BT", locality_type: "municipiu", population: 106847, latitude: 47.7500, longitude: 26.6667, is_county_seat: true },
   { name: "Satu Mare", name_ascii: "Satu Mare", county: "Satu Mare", county_code: "SM", locality_type: "municipiu", population: 102411, latitude: 47.7833, longitude: 22.8833, is_county_seat: true },
   { name: "Râmnicu Vâlcea", name_ascii: "Ramnicu Valcea", county: "Vâlcea", county_code: "VL", locality_type: "municipiu", population: 98776, latitude: 45.1000, longitude: 24.3667, is_county_seat: true },
   { name: "Suceava", name_ascii: "Suceava", county: "Suceava", county_code: "SV", locality_type: "municipiu", population: 92121, latitude: 47.6500, longitude: 26.2500, is_county_seat: true },
   { name: "Piatra Neamț", name_ascii: "Piatra Neamt", county: "Neamț", county_code: "NT", locality_type: "municipiu", population: 85055, latitude: 46.9333, longitude: 26.3667, is_county_seat: true },
   { name: "Drobeta-Turnu Severin", name_ascii: "Drobeta-Turnu Severin", county: "Mehedinți", county_code: "MH", locality_type: "municipiu", population: 92617, latitude: 44.6333, longitude: 22.6500, is_county_seat: true },
   { name: "Focșani", name_ascii: "Focsani", county: "Vrancea", county_code: "VN", locality_type: "municipiu", population: 79315, latitude: 45.7000, longitude: 27.1833, is_county_seat: true },
   { name: "Târgoviște", name_ascii: "Targoviste", county: "Dâmbovița", county_code: "DB", locality_type: "municipiu", population: 79610, latitude: 44.9333, longitude: 25.4500, is_county_seat: true },
   { name: "Bistrița", name_ascii: "Bistrita", county: "Bistrița-Năsăud", county_code: "BN", locality_type: "municipiu", population: 75076, latitude: 47.1333, longitude: 24.5000, is_county_seat: true },
   { name: "Reșița", name_ascii: "Resita", county: "Caraș-Severin", county_code: "CS", locality_type: "municipiu", population: 73282, latitude: 45.3000, longitude: 21.8833, is_county_seat: true },
   { name: "Tulcea", name_ascii: "Tulcea", county: "Tulcea", county_code: "TL", locality_type: "municipiu", population: 73707, latitude: 45.1833, longitude: 28.8000, is_county_seat: true },
   { name: "Călărași", name_ascii: "Calarasi", county: "Călărași", county_code: "CL", locality_type: "municipiu", population: 65181, latitude: 44.2000, longitude: 27.3333, is_county_seat: true },
   { name: "Giurgiu", name_ascii: "Giurgiu", county: "Giurgiu", county_code: "GR", locality_type: "municipiu", population: 61353, latitude: 43.9000, longitude: 25.9667, is_county_seat: true },
   { name: "Alba Iulia", name_ascii: "Alba Iulia", county: "Alba", county_code: "AB", locality_type: "municipiu", population: 63536, latitude: 46.0667, longitude: 23.5833, is_county_seat: true },
   { name: "Deva", name_ascii: "Deva", county: "Hunedoara", county_code: "HD", locality_type: "municipiu", population: 61123, latitude: 45.8833, longitude: 22.9167, is_county_seat: true },
   { name: "Hunedoara", name_ascii: "Hunedoara", county: "Hunedoara", county_code: "HD", locality_type: "municipiu", population: 60525, latitude: 45.7500, longitude: 22.9000, is_county_seat: false },
   { name: "Zalău", name_ascii: "Zalau", county: "Sălaj", county_code: "SJ", locality_type: "municipiu", population: 56202, latitude: 47.1833, longitude: 23.0500, is_county_seat: true },
   { name: "Sfântu Gheorghe", name_ascii: "Sfantu Gheorghe", county: "Covasna", county_code: "CV", locality_type: "municipiu", population: 54312, latitude: 45.8667, longitude: 25.7833, is_county_seat: true },
   { name: "Alexandria", name_ascii: "Alexandria", county: "Teleorman", county_code: "TR", locality_type: "municipiu", population: 45434, latitude: 43.9833, longitude: 25.3333, is_county_seat: true },
   { name: "Slobozia", name_ascii: "Slobozia", county: "Ialomița", county_code: "IL", locality_type: "municipiu", population: 45891, latitude: 44.5667, longitude: 27.3667, is_county_seat: true },
   { name: "Miercurea Ciuc", name_ascii: "Miercurea Ciuc", county: "Harghita", county_code: "HR", locality_type: "municipiu", population: 37980, latitude: 46.3500, longitude: 25.8000, is_county_seat: true },
   { name: "Vaslui", name_ascii: "Vaslui", county: "Vaslui", county_code: "VS", locality_type: "municipiu", population: 55407, latitude: 46.6333, longitude: 27.7333, is_county_seat: true },
   { name: "Slatina", name_ascii: "Slatina", county: "Olt", county_code: "OT", locality_type: "municipiu", population: 70293, latitude: 44.4333, longitude: 24.3667, is_county_seat: true },
   { name: "Târgu Jiu", name_ascii: "Targu Jiu", county: "Gorj", county_code: "GJ", locality_type: "municipiu", population: 82504, latitude: 45.0333, longitude: 23.2833, is_county_seat: true },
   // Popular tourist destinations
   { name: "Sinaia", name_ascii: "Sinaia", county: "Prahova", county_code: "PH", locality_type: "oras", population: 11195, latitude: 45.3500, longitude: 25.5500, is_county_seat: false },
   { name: "Bușteni", name_ascii: "Busteni", county: "Prahova", county_code: "PH", locality_type: "oras", population: 9772, latitude: 45.4167, longitude: 25.5333, is_county_seat: false },
   { name: "Predeal", name_ascii: "Predeal", county: "Brașov", county_code: "BV", locality_type: "oras", population: 5033, latitude: 45.5000, longitude: 25.5833, is_county_seat: false },
   { name: "Poiana Brașov", name_ascii: "Poiana Brasov", county: "Brașov", county_code: "BV", locality_type: "sat", population: 500, latitude: 45.5944, longitude: 25.5553, is_county_seat: false },
   { name: "Bran", name_ascii: "Bran", county: "Brașov", county_code: "BV", locality_type: "comuna", population: 4756, latitude: 45.5167, longitude: 25.3667, is_county_seat: false },
   { name: "Sighișoara", name_ascii: "Sighisoara", county: "Mureș", county_code: "MS", locality_type: "municipiu", population: 28102, latitude: 46.2167, longitude: 24.7833, is_county_seat: false },
   { name: "Mamaia", name_ascii: "Mamaia", county: "Constanța", county_code: "CT", locality_type: "stațiune", population: 2000, latitude: 44.2500, longitude: 28.6167, is_county_seat: false },
   { name: "Eforie Nord", name_ascii: "Eforie Nord", county: "Constanța", county_code: "CT", locality_type: "oras", population: 4832, latitude: 44.0667, longitude: 28.6333, is_county_seat: false },
   { name: "Mangalia", name_ascii: "Mangalia", county: "Constanța", county_code: "CT", locality_type: "municipiu", population: 36364, latitude: 43.8167, longitude: 28.5833, is_county_seat: false },
   { name: "Vama Veche", name_ascii: "Vama Veche", county: "Constanța", county_code: "CT", locality_type: "sat", population: 150, latitude: 43.7500, longitude: 28.5667, is_county_seat: false },
   { name: "Sulina", name_ascii: "Sulina", county: "Tulcea", county_code: "TL", locality_type: "oras", population: 3663, latitude: 45.1500, longitude: 29.6500, is_county_seat: false },
   { name: "Sovata", name_ascii: "Sovata", county: "Mureș", county_code: "MS", locality_type: "oras", population: 9772, latitude: 46.6000, longitude: 25.0667, is_county_seat: false },
   { name: "Băile Tușnad", name_ascii: "Baile Tusnad", county: "Harghita", county_code: "HR", locality_type: "oras", population: 1641, latitude: 46.1500, longitude: 25.8667, is_county_seat: false },
   { name: "Băile Herculane", name_ascii: "Baile Herculane", county: "Caraș-Severin", county_code: "CS", locality_type: "oras", population: 4893, latitude: 44.8833, longitude: 22.4167, is_county_seat: false },
   { name: "Băile Felix", name_ascii: "Baile Felix", county: "Bihor", county_code: "BH", locality_type: "sat", population: 2000, latitude: 46.9833, longitude: 21.9833, is_county_seat: false },
   { name: "Borșa", name_ascii: "Borsa", county: "Maramureș", county_code: "MM", locality_type: "oras", population: 27269, latitude: 47.6500, longitude: 24.6667, is_county_seat: false },
   { name: "Vișeu de Sus", name_ascii: "Viseu de Sus", county: "Maramureș", county_code: "MM", locality_type: "oras", population: 15372, latitude: 47.7167, longitude: 24.4333, is_county_seat: false },
   { name: "Rădăuți", name_ascii: "Radauti", county: "Suceava", county_code: "SV", locality_type: "municipiu", population: 23822, latitude: 47.8500, longitude: 25.9167, is_county_seat: false },
   { name: "Câmpulung Moldovenesc", name_ascii: "Campulung Moldovenesc", county: "Suceava", county_code: "SV", locality_type: "municipiu", population: 17329, latitude: 47.5333, longitude: 25.5500, is_county_seat: false },
   { name: "Vatra Dornei", name_ascii: "Vatra Dornei", county: "Suceava", county_code: "SV", locality_type: "municipiu", population: 14224, latitude: 47.3500, longitude: 25.3500, is_county_seat: false },
   { name: "Gura Humorului", name_ascii: "Gura Humorului", county: "Suceava", county_code: "SV", locality_type: "oras", population: 13667, latitude: 47.5500, longitude: 25.8833, is_county_seat: false },
   { name: "Voronet", name_ascii: "Voronet", county: "Suceava", county_code: "SV", locality_type: "sat", population: 500, latitude: 47.5167, longitude: 25.8500, is_county_seat: false },
   { name: "Sucevița", name_ascii: "Sucevita", county: "Suceava", county_code: "SV", locality_type: "comuna", population: 2500, latitude: 47.7833, longitude: 25.7167, is_county_seat: false },
   { name: "Putna", name_ascii: "Putna", county: "Suceava", county_code: "SV", locality_type: "comuna", population: 2857, latitude: 47.8667, longitude: 25.6000, is_county_seat: false },
   { name: "Moldovița", name_ascii: "Moldovita", county: "Suceava", county_code: "SV", locality_type: "comuna", population: 5000, latitude: 47.6833, longitude: 25.5500, is_county_seat: false },
   { name: "Curtea de Argeș", name_ascii: "Curtea de Arges", county: "Argeș", county_code: "AG", locality_type: "municipiu", population: 27548, latitude: 45.1333, longitude: 24.6833, is_county_seat: false },
   { name: "Câmpulung", name_ascii: "Campulung", county: "Argeș", county_code: "AG", locality_type: "municipiu", population: 32902, latitude: 45.2667, longitude: 25.0500, is_county_seat: false },
   { name: "Mioveni", name_ascii: "Mioveni", county: "Argeș", county_code: "AG", locality_type: "oras", population: 31998, latitude: 44.9500, longitude: 24.9333, is_county_seat: false },
   { name: "Turda", name_ascii: "Turda", county: "Cluj", county_code: "CJ", locality_type: "municipiu", population: 47744, latitude: 46.5667, longitude: 23.7833, is_county_seat: false },
   { name: "Dej", name_ascii: "Dej", county: "Cluj", county_code: "CJ", locality_type: "municipiu", population: 33497, latitude: 47.1500, longitude: 23.8833, is_county_seat: false },
   { name: "Câmpia Turzii", name_ascii: "Campia Turzii", county: "Cluj", county_code: "CJ", locality_type: "municipiu", population: 25135, latitude: 46.5500, longitude: 23.8833, is_county_seat: false },
   { name: "Gherla", name_ascii: "Gherla", county: "Cluj", county_code: "CJ", locality_type: "municipiu", population: 20450, latitude: 47.0333, longitude: 23.9167, is_county_seat: false },
   { name: "Huedin", name_ascii: "Huedin", county: "Cluj", county_code: "CJ", locality_type: "oras", population: 9300, latitude: 46.8667, longitude: 23.0333, is_county_seat: false },
   { name: "Mediaș", name_ascii: "Medias", county: "Sibiu", county_code: "SB", locality_type: "municipiu", population: 44034, latitude: 46.1667, longitude: 24.3500, is_county_seat: false },
   { name: "Cisnădie", name_ascii: "Cisnadie", county: "Sibiu", county_code: "SB", locality_type: "oras", population: 14580, latitude: 45.7167, longitude: 24.1500, is_county_seat: false },
   { name: "Avrig", name_ascii: "Avrig", county: "Sibiu", county_code: "SB", locality_type: "oras", population: 13860, latitude: 45.7167, longitude: 24.3833, is_county_seat: false },
   { name: "Făgăraș", name_ascii: "Fagaras", county: "Brașov", county_code: "BV", locality_type: "municipiu", population: 30714, latitude: 45.8500, longitude: 24.9833, is_county_seat: false },
   { name: "Săcele", name_ascii: "Sacele", county: "Brașov", county_code: "BV", locality_type: "municipiu", population: 31796, latitude: 45.6167, longitude: 25.6833, is_county_seat: false },
   { name: "Codlea", name_ascii: "Codlea", county: "Brașov", county_code: "BV", locality_type: "municipiu", population: 22765, latitude: 45.7000, longitude: 25.4500, is_county_seat: false },
   { name: "Râșnov", name_ascii: "Rasnov", county: "Brașov", county_code: "BV", locality_type: "oras", population: 15022, latitude: 45.5833, longitude: 25.4667, is_county_seat: false },
   { name: "Zărnești", name_ascii: "Zarnesti", county: "Brașov", county_code: "BV", locality_type: "oras", population: 23476, latitude: 45.5667, longitude: 25.3333, is_county_seat: false },
   { name: "Victoria", name_ascii: "Victoria", county: "Brașov", county_code: "BV", locality_type: "oras", population: 8241, latitude: 45.7333, longitude: 24.7000, is_county_seat: false },
   { name: "Rupea", name_ascii: "Rupea", county: "Brașov", county_code: "BV", locality_type: "oras", population: 5335, latitude: 46.0333, longitude: 25.2167, is_county_seat: false },
   { name: "Petroșani", name_ascii: "Petrosani", county: "Hunedoara", county_code: "HD", locality_type: "municipiu", population: 37160, latitude: 45.4167, longitude: 23.3667, is_county_seat: false },
   { name: "Lupeni", name_ascii: "Lupeni", county: "Hunedoara", county_code: "HD", locality_type: "municipiu", population: 24253, latitude: 45.3667, longitude: 23.2333, is_county_seat: false },
   { name: "Vulcan", name_ascii: "Vulcan", county: "Hunedoara", county_code: "HD", locality_type: "municipiu", population: 24160, latitude: 45.3833, longitude: 23.2667, is_county_seat: false },
   { name: "Brad", name_ascii: "Brad", county: "Hunedoara", county_code: "HD", locality_type: "municipiu", population: 14489, latitude: 46.1333, longitude: 22.8000, is_county_seat: false },
   { name: "Orăștie", name_ascii: "Orastie", county: "Hunedoara", county_code: "HD", locality_type: "municipiu", population: 18227, latitude: 45.8500, longitude: 23.2000, is_county_seat: false },
   { name: "Hațeg", name_ascii: "Hateg", county: "Hunedoara", county_code: "HD", locality_type: "oras", population: 10436, latitude: 45.6000, longitude: 22.9500, is_county_seat: false },
   { name: "Caransebeș", name_ascii: "Caransebes", county: "Caraș-Severin", county_code: "CS", locality_type: "municipiu", population: 25883, latitude: 45.4167, longitude: 22.2167, is_county_seat: false },
   { name: "Lugoj", name_ascii: "Lugoj", county: "Timiș", county_code: "TM", locality_type: "municipiu", population: 44571, latitude: 45.6833, longitude: 21.9000, is_county_seat: false },
   { name: "Sânnicolau Mare", name_ascii: "Sannicolau Mare", county: "Timiș", county_code: "TM", locality_type: "oras", population: 12312, latitude: 46.0667, longitude: 20.6333, is_county_seat: false },
   { name: "Jimbolia", name_ascii: "Jimbolia", county: "Timiș", county_code: "TM", locality_type: "oras", population: 10922, latitude: 45.7833, longitude: 20.7167, is_county_seat: false },
   { name: "Salonta", name_ascii: "Salonta", county: "Bihor", county_code: "BH", locality_type: "municipiu", population: 17578, latitude: 46.8000, longitude: 21.6500, is_county_seat: false },
   { name: "Beiuș", name_ascii: "Beius", county: "Bihor", county_code: "BH", locality_type: "municipiu", population: 10667, latitude: 46.6667, longitude: 22.3500, is_county_seat: false },
   { name: "Marghita", name_ascii: "Marghita", county: "Bihor", county_code: "BH", locality_type: "municipiu", population: 15467, latitude: 47.3500, longitude: 22.3333, is_county_seat: false },
   { name: "Năsăud", name_ascii: "Nasaud", county: "Bistrița-Năsăud", county_code: "BN", locality_type: "oras", population: 10333, latitude: 47.2833, longitude: 24.4000, is_county_seat: false },
   { name: "Beclean", name_ascii: "Beclean", county: "Bistrița-Năsăud", county_code: "BN", locality_type: "oras", population: 11269, latitude: 47.1833, longitude: 24.1833, is_county_seat: false },
   { name: "Reghin", name_ascii: "Reghin", county: "Mureș", county_code: "MS", locality_type: "municipiu", population: 33281, latitude: 46.7833, longitude: 24.7000, is_county_seat: false },
   { name: "Târnăveni", name_ascii: "Tarnaveni", county: "Mureș", county_code: "MS", locality_type: "municipiu", population: 22076, latitude: 46.3333, longitude: 24.2833, is_county_seat: false },
   { name: "Luduș", name_ascii: "Ludus", county: "Mureș", county_code: "MS", locality_type: "oras", population: 16214, latitude: 46.4833, longitude: 24.0833, is_county_seat: false },
   { name: "Odorheiu Secuiesc", name_ascii: "Odorheiu Secuiesc", county: "Harghita", county_code: "HR", locality_type: "municipiu", population: 34257, latitude: 46.3000, longitude: 25.3000, is_county_seat: false },
   { name: "Gheorgheni", name_ascii: "Gheorgheni", county: "Harghita", county_code: "HR", locality_type: "municipiu", population: 17634, latitude: 46.7167, longitude: 25.5833, is_county_seat: false },
   { name: "Toplița", name_ascii: "Toplita", county: "Harghita", county_code: "HR", locality_type: "municipiu", population: 13077, latitude: 46.9167, longitude: 25.3500, is_county_seat: false },
   { name: "Cristuru Secuiesc", name_ascii: "Cristuru Secuiesc", county: "Harghita", county_code: "HR", locality_type: "oras", population: 9310, latitude: 46.2833, longitude: 25.0333, is_county_seat: false },
   { name: "Târgu Secuiesc", name_ascii: "Targu Secuiesc", county: "Covasna", county_code: "CV", locality_type: "municipiu", population: 18491, latitude: 46.0000, longitude: 26.1333, is_county_seat: false },
   { name: "Covasna", name_ascii: "Covasna", county: "Covasna", county_code: "CV", locality_type: "oras", population: 10372, latitude: 45.8500, longitude: 26.1833, is_county_seat: false },
   { name: "Baraolt", name_ascii: "Baraolt", county: "Covasna", county_code: "CV", locality_type: "oras", population: 8999, latitude: 46.0667, longitude: 25.6000, is_county_seat: false },
   { name: "Onești", name_ascii: "Onesti", county: "Bacău", county_code: "BC", locality_type: "municipiu", population: 42294, latitude: 46.2500, longitude: 26.7500, is_county_seat: false },
   { name: "Moinești", name_ascii: "Moinesti", county: "Bacău", county_code: "BC", locality_type: "oras", population: 20552, latitude: 46.4667, longitude: 26.4833, is_county_seat: false },
   { name: "Comănești", name_ascii: "Comanesti", county: "Bacău", county_code: "BC", locality_type: "oras", population: 22037, latitude: 46.4333, longitude: 26.4500, is_county_seat: false },
   { name: "Buhuși", name_ascii: "Buhusi", county: "Bacău", county_code: "BC", locality_type: "oras", population: 18756, latitude: 46.7167, longitude: 26.7000, is_county_seat: false },
   { name: "Roman", name_ascii: "Roman", county: "Neamț", county_code: "NT", locality_type: "municipiu", population: 50713, latitude: 46.9167, longitude: 26.9333, is_county_seat: false },
   { name: "Târgu Neamț", name_ascii: "Targu Neamt", county: "Neamț", county_code: "NT", locality_type: "oras", population: 18695, latitude: 47.2000, longitude: 26.3667, is_county_seat: false },
   { name: "Bicaz", name_ascii: "Bicaz", county: "Neamț", county_code: "NT", locality_type: "oras", population: 7562, latitude: 46.8167, longitude: 25.8667, is_county_seat: false },
   { name: "Pașcani", name_ascii: "Pascani", county: "Iași", county_code: "IS", locality_type: "municipiu", population: 39049, latitude: 47.2500, longitude: 26.7167, is_county_seat: false },
   { name: "Hârlău", name_ascii: "Harlau", county: "Iași", county_code: "IS", locality_type: "oras", population: 10438, latitude: 47.4333, longitude: 26.9167, is_county_seat: false },
   { name: "Tecuci", name_ascii: "Tecuci", county: "Galați", county_code: "GL", locality_type: "municipiu", population: 34871, latitude: 45.8500, longitude: 27.4333, is_county_seat: false },
   { name: "Adjud", name_ascii: "Adjud", county: "Vrancea", county_code: "VN", locality_type: "municipiu", population: 17115, latitude: 46.1000, longitude: 27.1833, is_county_seat: false },
   { name: "Panciu", name_ascii: "Panciu", county: "Vrancea", county_code: "VN", locality_type: "oras", population: 8171, latitude: 45.9000, longitude: 27.0833, is_county_seat: false },
   { name: "Râmnicu Sărat", name_ascii: "Ramnicu Sarat", county: "Buzău", county_code: "BZ", locality_type: "municipiu", population: 33843, latitude: 45.3833, longitude: 27.0500, is_county_seat: false },
   { name: "Câmpina", name_ascii: "Campina", county: "Prahova", county_code: "PH", locality_type: "municipiu", population: 34249, latitude: 45.1167, longitude: 25.7333, is_county_seat: false },
   { name: "Băicoi", name_ascii: "Baicoi", county: "Prahova", county_code: "PH", locality_type: "oras", population: 17928, latitude: 45.0333, longitude: 25.8833, is_county_seat: false },
   { name: "Breaza", name_ascii: "Breaza", county: "Prahova", county_code: "PH", locality_type: "oras", population: 15945, latitude: 45.1833, longitude: 25.6667, is_county_seat: false },
   { name: "Comarnic", name_ascii: "Comarnic", county: "Prahova", county_code: "PH", locality_type: "oras", population: 11795, latitude: 45.2500, longitude: 25.6333, is_county_seat: false },
   { name: "Azuga", name_ascii: "Azuga", county: "Prahova", county_code: "PH", locality_type: "oras", population: 4803, latitude: 45.4500, longitude: 25.5833, is_county_seat: false },
   { name: "Urziceni", name_ascii: "Urziceni", county: "Ialomița", county_code: "IL", locality_type: "municipiu", population: 16116, latitude: 44.7167, longitude: 26.6333, is_county_seat: false },
   { name: "Fetești", name_ascii: "Fetesti", county: "Ialomița", county_code: "IL", locality_type: "municipiu", population: 28975, latitude: 44.3833, longitude: 27.8333, is_county_seat: false },
   { name: "Oltenița", name_ascii: "Oltenita", county: "Călărași", county_code: "CL", locality_type: "municipiu", population: 23983, latitude: 44.0833, longitude: 26.6333, is_county_seat: false },
   { name: "Caracal", name_ascii: "Caracal", county: "Olt", county_code: "OT", locality_type: "municipiu", population: 30954, latitude: 44.1167, longitude: 24.3500, is_county_seat: false },
   { name: "Corabia", name_ascii: "Corabia", county: "Olt", county_code: "OT", locality_type: "oras", population: 17067, latitude: 43.7833, longitude: 24.5000, is_county_seat: false },
   { name: "Balș", name_ascii: "Bals", county: "Olt", county_code: "OT", locality_type: "oras", population: 18901, latitude: 44.3500, longitude: 24.1000, is_county_seat: false },
   { name: "Turnu Măgurele", name_ascii: "Turnu Magurele", county: "Teleorman", county_code: "TR", locality_type: "municipiu", population: 24772, latitude: 43.7500, longitude: 24.8833, is_county_seat: false },
   { name: "Roșiori de Vede", name_ascii: "Rosiori de Vede", county: "Teleorman", county_code: "TR", locality_type: "municipiu", population: 27416, latitude: 44.1000, longitude: 24.9833, is_county_seat: false },
   { name: "Zimnicea", name_ascii: "Zimnicea", county: "Teleorman", county_code: "TR", locality_type: "oras", population: 13250, latitude: 43.6500, longitude: 25.3667, is_county_seat: false },
   { name: "Videle", name_ascii: "Videle", county: "Teleorman", county_code: "TR", locality_type: "oras", population: 10707, latitude: 44.2833, longitude: 25.5333, is_county_seat: false },
   { name: "Motru", name_ascii: "Motru", county: "Gorj", county_code: "GJ", locality_type: "municipiu", population: 21037, latitude: 44.8000, longitude: 22.9667, is_county_seat: false },
   { name: "Rovinari", name_ascii: "Rovinari", county: "Gorj", county_code: "GJ", locality_type: "oras", population: 11256, latitude: 44.9167, longitude: 23.1500, is_county_seat: false },
   { name: "Țăndărei", name_ascii: "Tandarei", county: "Ialomița", county_code: "IL", locality_type: "oras", population: 13206, latitude: 44.6500, longitude: 27.6500, is_county_seat: false },
   { name: "Călimănești", name_ascii: "Calimanesti", county: "Vâlcea", county_code: "VL", locality_type: "oras", population: 8451, latitude: 45.2333, longitude: 24.3333, is_county_seat: false },
   { name: "Drăgășani", name_ascii: "Dragasani", county: "Vâlcea", county_code: "VL", locality_type: "municipiu", population: 18460, latitude: 44.6667, longitude: 24.2667, is_county_seat: false },
   { name: "Horezu", name_ascii: "Horezu", county: "Vâlcea", county_code: "VL", locality_type: "oras", population: 6369, latitude: 45.1500, longitude: 23.9833, is_county_seat: false },
   { name: "Băile Govora", name_ascii: "Baile Govora", county: "Vâlcea", county_code: "VL", locality_type: "oras", population: 2643, latitude: 45.0833, longitude: 24.1833, is_county_seat: false },
   { name: "Băile Olănești", name_ascii: "Baile Olanesti", county: "Vâlcea", county_code: "VL", locality_type: "oras", population: 4515, latitude: 45.2000, longitude: 24.2500, is_county_seat: false },
   { name: "Bârlad", name_ascii: "Barlad", county: "Vaslui", county_code: "VS", locality_type: "municipiu", population: 55837, latitude: 46.2333, longitude: 27.6667, is_county_seat: false },
   { name: "Huși", name_ascii: "Husi", county: "Vaslui", county_code: "VS", locality_type: "municipiu", population: 26266, latitude: 46.6667, longitude: 28.0500, is_county_seat: false },
   { name: "Negrești", name_ascii: "Negresti", county: "Vaslui", county_code: "VS", locality_type: "oras", population: 8998, latitude: 46.8333, longitude: 27.4667, is_county_seat: false },
   { name: "Dorohoi", name_ascii: "Dorohoi", county: "Botoșani", county_code: "BT", locality_type: "municipiu", population: 27038, latitude: 47.9500, longitude: 26.4000, is_county_seat: false },
   { name: "Darabani", name_ascii: "Darabani", county: "Botoșani", county_code: "BT", locality_type: "oras", population: 10533, latitude: 48.2000, longitude: 26.6000, is_county_seat: false },
   { name: "Săveni", name_ascii: "Saveni", county: "Botoșani", county_code: "BT", locality_type: "oras", population: 7611, latitude: 47.9500, longitude: 26.8500, is_county_seat: false },
   { name: "Fălticeni", name_ascii: "Falticeni", county: "Suceava", county_code: "SV", locality_type: "municipiu", population: 26650, latitude: 47.4667, longitude: 26.3000, is_county_seat: false },
   { name: "Siret", name_ascii: "Siret", county: "Suceava", county_code: "SV", locality_type: "oras", population: 9062, latitude: 47.9500, longitude: 26.0667, is_county_seat: false },
   { name: "Solca", name_ascii: "Solca", county: "Suceava", county_code: "SV", locality_type: "oras", population: 2530, latitude: 47.6833, longitude: 25.8500, is_county_seat: false },
   { name: "Carei", name_ascii: "Carei", county: "Satu Mare", county_code: "SM", locality_type: "municipiu", population: 21112, latitude: 47.6833, longitude: 22.4667, is_county_seat: false },
   { name: "Negrești-Oaș", name_ascii: "Negresti-Oas", county: "Satu Mare", county_code: "SM", locality_type: "oras", population: 16132, latitude: 47.8667, longitude: 23.4167, is_county_seat: false },
   { name: "Tășnad", name_ascii: "Tasnad", county: "Satu Mare", county_code: "SM", locality_type: "oras", population: 8913, latitude: 47.4667, longitude: 22.5833, is_county_seat: false },
   { name: "Sighetu Marmației", name_ascii: "Sighetu Marmatiei", county: "Maramureș", county_code: "MM", locality_type: "municipiu", population: 37640, latitude: 47.9333, longitude: 23.8833, is_county_seat: false },
   { name: "Șimleu Silvaniei", name_ascii: "Simleu Silvaniei", county: "Sălaj", county_code: "SJ", locality_type: "oras", population: 14401, latitude: 47.2333, longitude: 22.8000, is_county_seat: false },
   { name: "Jibou", name_ascii: "Jibou", county: "Sălaj", county_code: "SJ", locality_type: "oras", population: 10407, latitude: 47.2667, longitude: 23.2500, is_county_seat: false },
   { name: "Cehu Silvaniei", name_ascii: "Cehu Silvaniei", county: "Sălaj", county_code: "SJ", locality_type: "oras", population: 7393, latitude: 47.4167, longitude: 22.9833, is_county_seat: false },
   { name: "Sebeș", name_ascii: "Sebes", county: "Alba", county_code: "AB", locality_type: "municipiu", population: 25635, latitude: 45.9667, longitude: 23.5667, is_county_seat: false },
   { name: "Aiud", name_ascii: "Aiud", county: "Alba", county_code: "AB", locality_type: "municipiu", population: 22876, latitude: 46.3000, longitude: 23.7000, is_county_seat: false },
   { name: "Blaj", name_ascii: "Blaj", county: "Alba", county_code: "AB", locality_type: "municipiu", population: 17780, latitude: 46.1833, longitude: 23.9167, is_county_seat: false },
   { name: "Cugir", name_ascii: "Cugir", county: "Alba", county_code: "AB", locality_type: "oras", population: 22089, latitude: 45.8333, longitude: 23.3667, is_county_seat: false },
   { name: "Ocna Mureș", name_ascii: "Ocna Mures", county: "Alba", county_code: "AB", locality_type: "oras", population: 13108, latitude: 46.4000, longitude: 23.8500, is_county_seat: false },
   { name: "Câmpeni", name_ascii: "Campeni", county: "Alba", county_code: "AB", locality_type: "oras", population: 7376, latitude: 46.3667, longitude: 23.0500, is_county_seat: false },
   { name: "Zlatna", name_ascii: "Zlatna", county: "Alba", county_code: "AB", locality_type: "oras", population: 7766, latitude: 46.1167, longitude: 23.2333, is_county_seat: false },
   { name: "Abrud", name_ascii: "Abrud", county: "Alba", county_code: "AB", locality_type: "oras", population: 5072, latitude: 46.2667, longitude: 23.0667, is_county_seat: false },
   { name: "Roșia Montană", name_ascii: "Rosia Montana", county: "Alba", county_code: "AB", locality_type: "comuna", population: 2531, latitude: 46.3000, longitude: 23.1333, is_county_seat: false },
   // Ilfov county - around Bucharest
   { name: "Voluntari", name_ascii: "Voluntari", county: "Ilfov", county_code: "IF", locality_type: "oras", population: 42944, latitude: 44.4833, longitude: 26.1833, is_county_seat: false },
   { name: "Pantelimon", name_ascii: "Pantelimon", county: "Ilfov", county_code: "IF", locality_type: "oras", population: 27267, latitude: 44.4500, longitude: 26.2000, is_county_seat: false },
   { name: "Popești-Leordeni", name_ascii: "Popesti-Leordeni", county: "Ilfov", county_code: "IF", locality_type: "oras", population: 20309, latitude: 44.3833, longitude: 26.1667, is_county_seat: false },
   { name: "Bragadiru", name_ascii: "Bragadiru", county: "Ilfov", county_code: "IF", locality_type: "oras", population: 18243, latitude: 44.3833, longitude: 26.0167, is_county_seat: false },
   { name: "Buftea", name_ascii: "Buftea", county: "Ilfov", county_code: "IF", locality_type: "oras", population: 21118, latitude: 44.5667, longitude: 25.9500, is_county_seat: false },
   { name: "Chitila", name_ascii: "Chitila", county: "Ilfov", county_code: "IF", locality_type: "oras", population: 14650, latitude: 44.5000, longitude: 26.0000, is_county_seat: false },
   { name: "Otopeni", name_ascii: "Otopeni", county: "Ilfov", county_code: "IF", locality_type: "oras", population: 14810, latitude: 44.5500, longitude: 26.0667, is_county_seat: false },
   { name: "Măgurele", name_ascii: "Magurele", county: "Ilfov", county_code: "IF", locality_type: "oras", population: 11087, latitude: 44.3500, longitude: 26.0333, is_county_seat: false },
   { name: "Snagov", name_ascii: "Snagov", county: "Ilfov", county_code: "IF", locality_type: "comuna", population: 7016, latitude: 44.7000, longitude: 26.1500, is_county_seat: false },
   { name: "Mogoșoaia", name_ascii: "Mogosoaia", county: "Ilfov", county_code: "IF", locality_type: "comuna", population: 12500, latitude: 44.5333, longitude: 26.0000, is_county_seat: false },
 ];
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     console.log(`Importing ${MAJOR_LOCALITIES.length} localities...`);
 
     // Upsert to database in batches
     const batchSize = 100;
     let inserted = 0;
     
     for (let i = 0; i < MAJOR_LOCALITIES.length; i += batchSize) {
       const batch = MAJOR_LOCALITIES.slice(i, i + batchSize);
       
       const { error } = await supabase
         .from('localities')
         .upsert(batch, { onConflict: 'name,county' });
       
       if (error) {
         console.error('Batch insert error:', error);
       } else {
         inserted += batch.length;
       }
     }
 
     console.log(`Successfully imported ${inserted} localities`);
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: `Imported ${inserted} localities`,
         total: MAJOR_LOCALITIES.length
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Error importing localities:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(
       JSON.stringify({ success: false, error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });