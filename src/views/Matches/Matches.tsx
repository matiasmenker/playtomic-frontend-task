import { useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import { useApiFetcher } from "@/lib/api";
import useSWR from "swr";
import Stack from "@mui/material/Stack";
import { Match } from "@/lib/api-types";
import Chip from "@mui/material/Chip";
import AvatarGroup from "@mui/material/AvatarGroup";
import Avatar from "@mui/material/Avatar";
import { convertToCSV, downloadCSV, getComparator } from "./Matches.utils";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface MatchKeys {
  courtId: number;
  venueId: number;
  matchId: number;
  sport: string;
  startDate: string;
  startTime: string;
  endTime: string;
}

interface MatchesProps {
  onLogoutRequest?: () => void;
}

type Order = "asc" | "desc";

const matchesCells = [
  { id: "courtId", label: "Court" },
  { id: "venueId", label: "Venue" },
  { id: "sport", label: "Sport" },
  { id: "startDate", label: "Date" },
  { id: "startTime", label: "Start" },
  { id: "endTime", label: "End" },
  { id: "players", label: "Players" },
];

/**
 * Matches component - Displays a table of matches with sorting, selection, and export features.
 *
 * @param {MatchesProps} props - Props for the Matches component.
 * @returns {JSX.Element} The rendered Matches component.
 */
export function Matches(props: MatchesProps) {
  const { onLogoutRequest, ...otherProps } = props;
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof MatchKeys>("sport");
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const fetcher = useApiFetcher();

  /**
   * Fetches matches data from the API.
   *
   * @param {{ page: number; size: number }} params - Pagination parameters.
   * @returns {Promise<{ matches: Match[]; total: number }>} The fetched matches data.
   */
  const fetchMatches = ({
    page,
    size,
  }: {
    page: number;
    size: number;
  }): Promise<{ matches: Match[]; total: number }> => {
    return fetcher("GET /v1/matches", { page, size }).then((res) => {
      if (!res.ok) {
        throw new Error(res.data.message);
      }
      const totalCount = res.headers.get("total");
      const total = totalCount ? Number.parseInt(totalCount) : res.data.length;
      return { matches: res.data, total };
    });
  };

  const query = useSWR({ page, size }, fetchMatches, {
    keepPreviousData: true,
    suspense: true,
  });

  const matches: Match[] = query.data.matches;
  const total: number = query.data.total;

  /**
   * Handles sorting of the table by a specific column.
   *
   * @param {keyof MatchKeys} property - The column to sort by.
   */
  const handleRequestSort = (property: keyof MatchKeys): void => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  /**
   * Handles selecting all matches in the table.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The select all checkbox event.
   */
  const handleSelectAllClick = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (event.target.checked) {
      const newSelected = matches.map((n) => n.matchId);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  /**
   * Handles selecting a single match.
   *
   * @param {string} id - The ID of the match to select.
   */
  const handleClick = (id: string): void => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter((selectedId) => selectedId !== id);
    }
    setSelected(newSelected);
  };

  /**
   * Handles pagination page changes.
   *
   * @param {unknown} _ - Event data (unused).
   * @param {number} newPage - The new page number.
   */
  const handleChangePage = (_: unknown, newPage: number): void => {
    setPage(newPage);
  };

  /**
   * Handles changes to the number of rows per page.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The rows per page change event.
   */
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  /**
   * Exports the selected matches to a CSV file.
   */
  const handleExportSelected = (): void => {
    if (selected.length === 0) return;

    const selectedMatches = matches.filter((match) =>
      selected.includes(match.matchId)
    );

    const csvContent = convertToCSV(selectedMatches);
    downloadCSV(csvContent, "selected_matches.csv");
  };

  /**
   * Recursively fetches all matches from the API.
   *
   * @param {number} page - The current page.
   * @param {number} size - The number of items per page.
   * @param {Match[]} accumulatedMatches - The matches collected so far.
   * @returns {Promise<Match[]>} All matches.
   */
  const fetchAllMatches = (
    page = 0,
    size = 10,
    accumulatedMatches: Match[] = []
  ): Promise<Match[]> => {
    return fetcher("GET /v1/matches", { page, size }).then((res) => {
      if (!res.ok) {
        throw new Error(res.data.message);
      }

      const fetchedMatches = res.data;
      const totalCount = res.headers.get("total");
      const total = totalCount ? Number.parseInt(totalCount) : res.data.length;

      const allMatches = [...accumulatedMatches, ...fetchedMatches];

      if (allMatches.length < total) {
        return fetchAllMatches(page + 1, size, allMatches);
      }

      return allMatches;
    });
  };

  /**
   * Exports all matches to a CSV file.
   */
  const handleExportAll = async (): Promise<void> => {
    try {
      const allMatches = await fetchAllMatches(); // Recursive fetch
      const csvContent = convertToCSV(allMatches);
      downloadCSV(csvContent, "all_matches.csv");
    } catch (error) {
      console.error("Error fetching all matches:", error);
    }
  };

  const visibleMatches = matches
    .map((match) => ({
      ...match,
      startDate: match.startDate.substring(0, 10),
      startTime: match.startDate.substring(11, 16),
      endTime: match.endDate.substring(11, 16),
    }))
    .slice()
    .sort(getComparator(order, orderBy));

  return (
    <Stack
      {...otherProps}
      spacing={2}
      sx={{ backgroundColor: "#f3f4f5", height: "100vh" }}
    >
      {/* AppBar */}
      <AppBar
        position="static"
        color="default"
        sx={{ backgroundColor: "#FFFFFF" }}
      >
        <Toolbar
          sx={{
            display: "flex",
            backgroundColor: "#FFF",
            padding: "20px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignSelf: "center",
              width: "40px",
              height: "40px",
              borderRadius: "4px",
              img: {
                borderRadius: "8px",
              },
            }}
          >
            <img
              alt={"logo"}
              src={
                "https://scontent-mad2-1.xx.fbcdn.net/v/t39.30808-6/466425116_1200971608049513_9169463776648796533_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=i3KXDvb_i0AQ7kNvgFc6Wpk&_nc_zt=23&_nc_ht=scontent-mad2-1.xx&_nc_gid=ALsULOLB86BaPJCsqdPqx2j&oh=00_AYDxOsqIkWoKZxm4zwDt4ugOA73qCX17LoQ2Q9cJKkZiHA&oe=67675F02"
              }
            />
          </Box>

          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={onLogoutRequest}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Matches Table */}
      <Box sx={{ width: "100%", p: 2 }}>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5">Matches 🎾</Typography>
          <div>
            <Button
              variant="outlined"
              color="success"
              size="small"
              disabled={selected.length === 0}
              onClick={handleExportSelected}
            >
              Export Selected ({selected.length})
            </Button>
            <Button
              sx={{ ml: 2 }}
              variant="contained"
              color="success"
              size="small"
              onClick={handleExportAll}
            >
              Export All Matches
            </Button>
          </div>
        </Box>

        <Paper sx={{ width: "100%" }}>
          <TableContainer>
            <Table
              sx={{ minWidth: 650 }}
              size="medium"
              aria-label="Matches"
              role="table"
            >
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={
                        selected.length > 0 && selected.length < matches.length
                      }
                      checked={
                        matches.length > 0 && selected.length === matches.length
                      }
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  {matchesCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      sx={{
                        fontSize: "16px", // Larger font size
                        fontWeight: "bold", // Make text bold
                        color: "#333", // Text color
                        height: "50px",
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : "asc"}
                        onClick={() =>
                          handleRequestSort(headCell.id as keyof MatchKeys)
                        }
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleMatches.map((match) => {
                  return (
                    <TableRow
                      hover
                      onClick={() => handleClick(match.matchId)}
                      role="row"
                      aria-checked={selected.includes(match.matchId)}
                      tabIndex={-1}
                      key={match.matchId}
                      selected={selected.includes(match.matchId)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={selected.includes(match.matchId)}
                        />
                      </TableCell>
                      <TableCell>{match.courtId}</TableCell>
                      <TableCell>{match.venueId}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={
                            match.sport === "TENNIS" ? "warning" : "success"
                          }
                          label={match.sport}
                        />
                      </TableCell>
                      <TableCell>{match.startDate}</TableCell>
                      <TableCell>{match.startTime}</TableCell>
                      <TableCell>{match.endTime}</TableCell>
                      <TableCell>
                        <AvatarGroup max={4} sx={{ flexDirection: "row" }}>
                          {match.teams
                            .flatMap((team) => team.players)
                            .map((player) => (
                              <Avatar
                                key={player.userId}
                                sx={{ width: 28, height: 28 }}
                                alt={player.displayName}
                                src={player.pictureURL ?? undefined}
                              />
                            ))}
                        </AvatarGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10]}
            component="div"
            count={total}
            rowsPerPage={size}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </Stack>
  );
}
