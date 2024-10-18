'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth, signIn, signOut } from './auth';
import { getBookings } from './data-service';
import { supabase } from './supabase';

// Must be an alphanumeric string, between 6-12 characters
const RGX_NATIONAL_ID = /^[a-zA-Z0-9]{6,12}$/;

export async function signInAction() {
  await signIn('google', { redirectTo: '/account' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

export async function updateProfile(formData) {
  const session = await auth();

  if (!session) throw new Error('You must be logged in');

  const nationalID = formData.get('nationalID');
  const [nationality, countryFlag] = formData.get('nationality').split('%');

  if (!RGX_NATIONAL_ID.test(nationalID))
    throw new Error('Please provide a valid nationalID');

  const updateData = {
    nationality,
    nationalID,
    countryFlag,
  };

  const { data, error } = await supabase
    .from('guests')
    .update(updateData)
    .eq('id', session?.user?.guestId);

  if (error) throw new Error('Guest could not be updated');

  revalidatePath('/account/profile');
}

export async function deleteBooking(bookingId) {
  const session = await auth();

  if (!session) throw new Error('You must be logged in');

  const bookings = await getBookings(session?.user?.guestId);

  const guestBookingIds = bookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to delete this booking');

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (error) throw new Error('Booking could not be deleted');

  revalidatePath('/account/reservations');
}

export async function updateBooking(formData) {
  const session = await auth();

  if (!session) throw new Error('You must be logged in');

  const bookingId = Number(formData.get('bookingId'));
  const bookings = await getBookings(session?.user?.guestId);

  const guestBookingIds = bookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to update this booking');

  const updateData = {
    numGuests: Number(formData.get('numGuests')),
    observations: bookingData.get('observations').slice(0, 1000),
  };

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId);

  if (error) throw new Error('Booking could not be updated');

  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath('/account/reservations');
  redirect('/account/reservations');
}

export async function createBooking(bookingData, formData) {
  const session = await auth();

  if (!session) throw new Error('You must be logged in');

  const newBooking = {
    ...bookingData,
    guestId: session?.user?.guestId,
    numGuests: formData.get('numGuests'),
    observations: formData.get('observations').slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: 'unconfirmed',
  };

  const { error } = await supabase.from('bookings').insert([newBooking]);

  if (error) throw new Error('Booking could not be created');

  revalidatePath(`/cabins/${bookingData.cabinId}`);
  redirect('/cabins/thankyou');
}
