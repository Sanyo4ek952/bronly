export type BookingStatus = "reserved" | "paid" | "living" | "checked_out";

export type Booking = {
  id: string;
  user_id: string;
  property_id: string;
  property_title: string;
  guest_name: string;
  phone: string;
  check_in: string;
  check_out: string;
  amount: number;
  status: BookingStatus;
  comment: string | null;
  created_at: string;
};

export type BookingFormValues = {
  property_id: string;
  guest_name: string;
  phone: string;
  check_in: string;
  check_out: string;
  amount: string;
  status: BookingStatus;
  comment: string;
};
