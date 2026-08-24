import { hotelApi } from '../services/hotels/hotelApi';

export async function enrichReservation(reservation) {
  const [hotelResult, roomTypeResult] = await Promise.allSettled([
    hotelApi.getHotel(reservation.hotel_id),
    hotelApi.getRoomType(reservation.hotel_id, reservation.room_type_id),
  ]);

  return {
    ...reservation,
    hotel: hotelResult.status === 'fulfilled' ? hotelResult.value.data?.data : reservation.hotel,
    room_type: roomTypeResult.status === 'fulfilled' ? roomTypeResult.value.data?.data : reservation.room_type,
  };
}
