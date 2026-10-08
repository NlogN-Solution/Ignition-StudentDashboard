import React from "react";
import { render, screen } from "@testing-library/react";
import JourneyPanel from "./JourneyPanel";

jest.mock("../../context/AppDataContext", () => ({ useAppData: () => ({ documents: [], uploadDocument: jest.fn() }) }));
jest.mock("../../context/ToastContext", () => ({ useToast: () => ({ showToast: jest.fn() }) }));
jest.mock("../../api/journey", () => ({}));
jest.mock("../../api/studentPortal", () => ({}));
jest.mock("../dashboard/ui", () => ({ Card: ({ children, ...props }) => <div {...props}>{children}</div> }));
jest.mock("./JourneyStages", () => ({
  BookingStage: () => null,
  ChecklistStage: () => null,
  DocumentsStage: () => null,
  InfoStage: () => null,
  IssuedStage: ({ step }) => <p>Letter stage: {step.name}</p>,
  ReviewStage: ({ step }) => <p>Review stage: {step.name}</p>,
}));

test("an offer deep link stays on the offer even when interview preparation is current", () => {
  const journey = { currentStepId: "prep", steps: [
    { id: "offer", key: "offer", name: "Offer letter", kind: "issued", status: "completed", config: { milestone_status: "offer_received" } },
    { id: "prep", key: "interview_prep", name: "Interview preparation", kind: "review", status: "current" },
  ] };
  render(<JourneyPanel applicationId="app" journey={journey} documents={[]} requestedStage="offer" />);
  expect(screen.getByRole("heading", { name: "Offer letter" })).toBeTruthy();
  expect(screen.getByText("Letter stage: Offer letter")).toBeTruthy();
  expect(screen.queryByText("Review stage: Interview preparation")).toBeNull();
});
