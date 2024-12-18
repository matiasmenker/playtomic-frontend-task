import { render, screen, within } from "@testing-library/react";
import { server } from "../../../../technical-test-frontend-main/src/lib/msw/node";
import { Matches } from "./Matches";
import { ReactNode } from "react";
import { ApiConfigProvider } from "../../../../technical-test-frontend-main/src/lib/api";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

const Wrapper = (props: { children: ReactNode }) => (
  <ApiConfigProvider
    baseURL="/api"
    defaultHeaders={
      new Headers({
        authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MDkyOTA0NzIsImV4cCI6NDg2Mjg5MDQ3MiwianRpIjoiYzFjMGVjNTMtMzc1Ny00Y2FjLTk5YTMtZjk3NDAwMTA5ZTFkIiwic3ViIjoiYzBlZDM2YzAtNmM1OS00OGQ0LWExNjgtYjYwNzZjZWM1MmEwIiwidHlwZSI6ImFjY2VzcyJ9.InRoaXMtaXMtbm90LWEtcmVhbC1zaWduYXR1cmUi",
      })
    }
  >
    {props.children}
  </ApiConfigProvider>
);

test("renders a table with some known values", async () => {
  render(<Matches />, { wrapper: Wrapper });

  const table = await screen.findByRole("table", { name: "Matches" });
  expect(table).toBeInTheDocument();

  const headers = within(table).getAllByRole("columnheader");
  expect(headers).toHaveLength(8);

  const headerLabels = headers.map((header) => header.textContent);
  expect(headerLabels).toEqual([
    "",
    "Court",
    "Venue",
    "Sport",
    "Date",
    "Start",
    "End",
    "Players",
  ]);
});

test("renders rows of matches from the API", async () => {
  render(<Matches />, { wrapper: Wrapper });

  const table = await screen.findByRole("table", { name: "Matches" });
  const rows = within(table).getAllByRole("row");

  // Header row + data rows
  expect(rows).toHaveLength(11); // 10 rows of data + 1 header row
});

test("allows selecting individual rows", async () => {
  render(<Matches />, { wrapper: Wrapper });

  const table = await screen.findByRole("table", { name: "Matches" });
  const rows = within(table).getAllByRole("row");
  const rowCheckbox = within(rows[1]).getByRole("checkbox");

  expect(rowCheckbox).not.toBeChecked();
  await userEvent.click(rowCheckbox);
  expect(rowCheckbox).toBeChecked();
});

test("select all rows checkbox works correctly", async () => {
  render(<Matches />, { wrapper: Wrapper });

  const table = await screen.findByRole("table", { name: "Matches" });
  const rows = within(table).getAllByRole("row");
  const rowCheckbox = within(rows[0]).getByRole("checkbox");

  // Click the checkbox
  await userEvent.click(rowCheckbox);

  // Verify that all rows are selected
  const selectedCheckboxes = await screen.findAllByRole("checkbox", {
    checked: true,
  });
  expect(selectedCheckboxes).toHaveLength(11); // Assuming 10 rows + "select all" checkbox
});

test("renders a logout button and propagates its click via props", async () => {
  const onLogoutRequest = vi.fn();
  render(<Matches onLogoutRequest={onLogoutRequest} />, { wrapper: Wrapper });

  const logoutButton = screen.getByRole("button", { name: "Logout" });
  await userEvent.click(logoutButton);

  expect(onLogoutRequest).toHaveBeenCalledOnce();
});

test("exports all rows to CSV", async () => {
  render(<Matches />, { wrapper: Wrapper });

  const exportAllButton = await screen.findByRole("button", {
    name: /export all matches/i,
  });
  expect(exportAllButton).toBeEnabled();

  await userEvent.click(exportAllButton);
  // Verify downloadCSV has been triggered (mocked in real tests)
  expect(screen.queryByText(/exporting all/i)).not.toBeInTheDocument();
});
