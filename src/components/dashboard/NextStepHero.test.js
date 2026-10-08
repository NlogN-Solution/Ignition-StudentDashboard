import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NextStepHero from "./NextStepHero";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), { virtual: true });

test("staff-assigned interview tasks appear in the blue card before a general journey action", () => {
  render(<NextStepHero task={{ id: "task-1", title: "Practise your answers", stage: "Interview preparation", isPriority: true }} journeyAction={{ applicationId: "app", title: "Book your interview" }} />);
  expect(screen.getByRole("heading", { name: "Practise your answers" })).toBeTruthy();
  expect(screen.getByText("Interview preparation")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Complete task" }));
  expect(mockNavigate).toHaveBeenCalledWith("/tasks#task-1");
});
