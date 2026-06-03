import type { GuestRequest } from "@/entities/request/model/types";

export const guestRequests: GuestRequest[] = [
  {
    id: "req-1",
    guestName: "Екатерина Смирнова",
    phone: "+7 900 123-45-67",
    createdAt: "22 мая, 15:30",
    roomId: "room-1",
    status: "new",
    checkIn: "15 июня 2024 после 14:00",
    checkOut: "20 июня 2024 до 11:00",
    guestsLabel: "2 взрослых, 1 ребенок",
    comment: "Хотим ранний заезд, если возможно.",
    totalPrice: 45000,
  },
  {
    id: "req-2",
    guestName: "Сергей Иванов",
    phone: "+7 911 222-33-44",
    createdAt: "22 мая, 12:10",
    roomId: "room-5",
    status: "in_progress",
    checkIn: "12 июня 2024 после 14:00",
    checkOut: "17 июня 2024 до 11:00",
    guestsLabel: "3 взрослых",
    comment: "Нужна кухня и отдельное рабочее место.",
    totalPrice: 27500,
  },
  {
    id: "req-3",
    guestName: "Анна Петрова",
    phone: "+7 999 456-78-90",
    createdAt: "21 мая, 20:45",
    roomId: "room-2",
    status: "confirmed",
    checkIn: "02 июня 2024 после 14:00",
    checkOut: "07 июня 2024 до 11:00",
    guestsLabel: "2 взрослых, 2 ребенка",
    comment: "Будем на машине.",
    totalPrice: 31000,
  },
  {
    id: "req-4",
    guestName: "Дмитрий Ковалев",
    phone: "+7 921 111-11-11",
    createdAt: "21 мая, 11:05",
    roomId: "room-1",
    status: "declined",
    checkIn: "25 мая 2024 после 14:00",
    checkOut: "28 мая 2024 до 11:00",
    guestsLabel: "2 взрослых",
    comment: "Интересует только первая линия.",
    totalPrice: 17800,
  },
];

export function formatRequestStatus(status: GuestRequest["status"]) {
  switch (status) {
    case "in_progress":
      return "В работе";
    case "confirmed":
      return "Подтверждена";
    case "declined":
      return "Отклонена";
    default:
      return "Новая";
  }
}
