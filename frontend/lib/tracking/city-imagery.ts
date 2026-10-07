type CityPhoto = {
  city: string;
  src: string;
  author: string;
  license: string;
  source: string;
};

const photos = {
  jakarta: { city: 'Jakarta', src: '/tracking-cities/jakarta.webp', author: 'Georgi Kovachev', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:JakartaSkyline.jpg' },
  bekasi: { city: 'Bekasi', src: '/tracking-cities/bekasi.webp', author: 'Everyone Sinks Starco', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Bekasi_aerial_view.jpg' },
  tangerangSelatan: { city: 'Tangerang Selatan', src: '/tracking-cities/tangerang-selatan.webp', author: 'Penggunaandro', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:CBD_Alam_Sutera.jpg' },
  tangerang: { city: 'Tangerang', src: '/tracking-cities/tangerang.webp', author: 'Vruztazzy', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File:Jembatan_UNIS_(Jembatan_Merah)_di_Cikokol,_Tangerang.jpg' },
  malang: { city: 'Malang', src: '/tracking-cities/malang.webp', author: 'Uliyanti', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Malang_city.jpg' },
  semarang: { city: 'Semarang', src: '/tracking-cities/semarang.webp', author: 'Muhammad Cordiaz', license: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Simpang_Lima_Semarang_-_panoramio_(cropped).jpg' },
  surabaya: { city: 'Surabaya', src: '/tracking-cities/surabaya.webp', author: 'Rifky2011', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File:Surabaya_City_Skyline_in_July_2025.jpg' },
  bandung: { city: 'Bandung', src: '/tracking-cities/bandung.webp', author: 'Sabung.hamster', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Bandung_city_centre,_July_2014.jpg' },
} satisfies Record<string, CityPhoto>;

function photoForPlace(value: string | null): CityPhoto | null {
  if (!value) return null;
  const place = value.toLocaleLowerCase('id-ID');
  if (/tangerang selatan|serpong|alam sutera|bintaro/.test(place)) return photos.tangerangSelatan;
  if (/tangerang|cikokol/.test(place)) return photos.tangerang;
  if (/jakarta|cilandak|kebayoran|sudirman/.test(place)) return photos.jakarta;
  if (/bekasi/.test(place)) return photos.bekasi;
  if (/semarang/.test(place)) return photos.semarang;
  if (/surabaya/.test(place)) return photos.surabaya;
  if (/bandung/.test(place)) return photos.bandung;
  if (/malang/.test(place)) return photos.malang;
  return null;
}

/** A last-known hub must not be illustrated with an unrelated destination city. */
export function resolveTrackingCityPhoto(currentLocation: string | null, destinationCity: string | null): { photo: CityPhoto; context: 'current' | 'destination' } | null {
  if (currentLocation?.trim()) {
    const photo = photoForPlace(currentLocation);
    return photo ? { photo, context: 'current' } : null;
  }
  const photo = photoForPlace(destinationCity);
  return photo ? { photo, context: 'destination' } : null;
}
