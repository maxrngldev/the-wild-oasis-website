import { UpdateReservationForm } from '@/app/_components/UpdateReservationForm';
import { getBooking, getCabin } from '@/app/_lib/data-service';

export const metadata = {
  title: 'Update Reservation',
};

export default async function Page({ params }) {
  const booking = await getBooking(params.id);
  const cabin = await getCabin(booking.cabinId);

  const reservationId = params.id;

  return (
    <div>
      <h2 className='font-semibold text-2xl text-accent-400 mb-7'>
        Edit Reservation #{reservationId}
      </h2>
      <UpdateReservationForm booking={booking} cabin={cabin} />
    </div>
  );
}
