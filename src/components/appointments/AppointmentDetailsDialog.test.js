import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import AppointmentDetailsDialog from "./AppointmentDetailsDialog";

test("appointment details render above the shell and close with Escape", () => {
  const close = jest.fn();
  const { container } = render(<AppointmentDetailsDialog appointment={{ meetingType: "Visa consultation", status: "confirmed", location: "Office 2", notes: "Bring your passport", counsellorName: "Counsellor", durationMinutes: 30 }} onClose={close} />);
  const dialog = screen.getByRole("dialog", { name: "Visa consultation" });
  expect(container.contains(dialog)).toBe(false);
  expect(screen.getByText("Office 2")).toBeTruthy();
  expect(screen.getByText("Bring your passport")).toBeTruthy();
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(close).toHaveBeenCalledTimes(1);
});
