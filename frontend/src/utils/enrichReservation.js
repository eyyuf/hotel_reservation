import { hotelApi } from '../services/hotels/hotelApi';

export async function enrichReservation(reservation) {
  if (!reservation) return reservation;

  const hasHotel = !!reservation.hotel?.name;
  const hasRoomType = !!reservation.room_type?.name;

  // If already enriched with valid hotel and room type, reuse directly
  if (hasHotel && hasRoomType) {
    return reservation;
  }

  const [hotelResult, roomTypeResult] = await Promise.allSettled([
    hasHotel ? Promise.resolve({ data: { data: reservation.hotel } }) : hotelApi.getHotel(reservation.hotel_id),
    hasRoomType ? Promise.resolve({ data: { data: reservation.room_type } }) : hotelApi.getRoomType(reservation.hotel_id, reservation.room_type_id),
  ]);

  return {
    ...reservation,
    hotel: hotelResult.status === 'fulfilled' ? hotelResult.value.data?.data : reservation.hotel,
    room_type: roomTypeResult.status === 'fulfilled' ? roomTypeResult.value.data?.data : reservation.room_type,
  };
}

/**
 * Batch-enrich multiple reservations by deduplicating hotel and room type requests.
 * Instead of 2 HTTP calls per reservation (N+1), this fetches each unique hotel
 * and each unique room type exactly once, then maps results back.
 *
 * @param {Array} reservations - Array of reservation objects with hotel_id and room_type_id
 * @returns {Promise<Array>} - Enriched reservations with hotel and room_type objects
 */
export async function batchEnrichReservations(reservations) {
  if (!reservations || reservations.length === 0) return [];

  // Check if all reservations are already enriched
  const allAlreadyEnriched = reservations.every(
    (r) => r.hotel?.name && r.room_type?.name
  );
  if (allAlreadyEnriched) {
    return reservations;
  }

  // Collect unique hotel IDs only for reservations that lack hotel data
  const uniqueHotelIds = [...new Set(
    reservations
      .filter((r) => !r.hotel?.name)
      .map((r) => r.hotel_id)
      .filter(Boolean)
  )];

  // Collect unique (hotel_id, room_type_id) pairs only for reservations that lack room_type data
  const roomTypeKeySet = new Set();
  const uniqueRoomTypePairs = [];
  for (const r of reservations) {
    if (!r.room_type?.name && r.hotel_id && r.room_type_id) {
      const key = `${r.hotel_id}:${r.room_type_id}`;
      if (!roomTypeKeySet.has(key)) {
        roomTypeKeySet.add(key);
        uniqueRoomTypePairs.push({ hotelId: r.hotel_id, roomTypeId: r.room_type_id });
      }
    }
  }

  // Fetch only the missing unique hotels and room types in parallel
  const [hotelResults, roomTypeResults] = await Promise.all([
    Promise.allSettled(uniqueHotelIds.map((id) => hotelApi.getHotel(id))),
    Promise.allSettled(uniqueRoomTypePairs.map((p) => hotelApi.getRoomType(p.hotelId, p.roomTypeId))),
  ]);

  // Build lookup maps
  const hotelMap = new Map();
  uniqueHotelIds.forEach((id, i) => {
    if (hotelResults[i].status === 'fulfilled') {
      hotelMap.set(id, hotelResults[i].value.data?.data);
    }
  });

  const roomTypeMap = new Map();
  uniqueRoomTypePairs.forEach((pair, i) => {
    if (roomTypeResults[i].status === 'fulfilled') {
      const key = `${pair.hotelId}:${pair.roomTypeId}`;
      roomTypeMap.set(key, roomTypeResults[i].value.data?.data);
    }
  });

  // Map enrichment data back to each reservation
  return reservations.map((r) => ({
    ...r,
    hotel: r.hotel?.name ? r.hotel : (hotelMap.get(r.hotel_id) || r.hotel),
    room_type: r.room_type?.name ? r.room_type : (roomTypeMap.get(`${r.hotel_id}:${r.room_type_id}`) || r.room_type),
  }));
}
