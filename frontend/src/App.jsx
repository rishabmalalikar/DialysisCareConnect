import { useMemo, useState, useEffect } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import {
  AccessTimeRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  EventAvailableRounded,
  GroupsRounded,
  LocalHospitalRounded,
  PersonRounded,
  RefreshRounded,
  SearchRounded,
  SendRounded,
  WhatsApp,
} from "@mui/icons-material";





// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const getInitials = (name) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeString) => {
  if (!timeString) return "-";

  const [hours, minutes] = timeString.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getWhatsAppMessage = (appointment) => {
  return `Dear${appointment.patientName},

Your dialysis appointment has been scheduled.

Date: ${formatDate(appointment.appointmentDate)}
Time: ${formatTime(appointment.appointmentTime)}

Please arrive on time for your scheduled dialysis session.`;
};


// -----------------------------------------------------------------------------
// App
// -----------------------------------------------------------------------------

export default function App() {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientError, setPatientError] = useState("");

  const [selectedUnit, setSelectedUnit] = useState("All Units");
  const [search, setSearch] = useState("");

  const [selectedPatients, setSelectedPatients] = useState([]);

  // Appointment records are kept separately from patients.
  const [appointments, setAppointments] = useState([]);

  // Scheduling modal
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const [scheduleMode, setScheduleMode] = useState("bulk");

  const [bulkDate, setBulkDate] = useState("");
  const [bulkTime, setBulkTime] = useState("");

  const [individualSchedules, setIndividualSchedules] = useState({});

  // Review modal
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Final appointment records waiting for confirmation.
  const [reviewAppointments, setReviewAppointments] = useState([]);


  const [sendingMessages, setSendingMessages] = useState(false);

  // Snackbar / alert
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });


const units = [
  "All Units",
  ...new Set(patients.map((patient) => patient.unit).filter(Boolean)),
];

  // ---------------------------------------------------------------------------
  // Filter patients
  // ---------------------------------------------------------------------------

  const filteredPatients = patients.filter((patient) => {
  const matchesUnit =
    selectedUnit === "All Units" || patient.unit === selectedUnit;

  const searchValue = search.toLowerCase().trim();

  const matchesSearch =
    !searchValue ||
    patient.name.toLowerCase().includes(searchValue) ||
    patient.uhid.toLowerCase().includes(searchValue) ||
    patient.mobile.includes(searchValue);

  return matchesUnit && matchesSearch;
});


  // ---------------------------------------------------------------------------
  // Selected patient objects
  // ---------------------------------------------------------------------------

  const selectedPatientList = useMemo(() => {
    return patients.filter((patient) =>
      selectedPatients.includes(patient.id)
    );
  }, [patients, selectedPatients]);


  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  const scheduledCount = appointments.length;

const queuedCount = appointments.filter(
  (appointment) => appointment.whatsappStatus === "Failed"
).length;


  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------

  const togglePatient = (patientId) => {
    setSelectedPatients((current) => {
      if (current.includes(patientId)) {
        return current.filter((id) => id !== patientId);
      }

      return [...current, patientId];
    });
  };

  const selectAllVisible = () => {
    const visibleIds = filteredPatients.map((patient) => patient.id);

    setSelectedPatients((current) => {
      const merged = new Set([...current, ...visibleIds]);

      return Array.from(merged);
    });
  };

  const clearSelection = () => {
    setSelectedPatients([]);
  };


  // ---------------------------------------------------------------------------
  // Scheduling modal
  // ---------------------------------------------------------------------------

  const openScheduleDialog = () => {
    if (selectedPatients.length === 0) {
      setToast({
        open: true,
        message: "Please select at least one patient.",
        severity: "warning",
      });

      return;
    }

    const existingSchedules = {};

    selectedPatientList.forEach((patient) => {
      const existingAppointment = [...appointments]
        .filter((appointment) => appointment.patientId === patient.id)
        .sort(
          (a, b) =>
            new Date(
              `${b.appointmentDate}T${b.appointmentTime}`
            ) -
            new Date(
              `${a.appointmentDate}T${a.appointmentTime}`
            )
        )[0];

      existingSchedules[patient.id] = {
        date: existingAppointment?.appointmentDate || "",
        time: existingAppointment?.appointmentTime || "",
      };
    });

    setIndividualSchedules(existingSchedules);

    setScheduleMode("bulk");
    setBulkDate("");
    setBulkTime("");

    setScheduleDialogOpen(true);
  };

  const closeScheduleDialog = () => {
    setScheduleDialogOpen(false);
  };


  // ---------------------------------------------------------------------------
  // Individual schedule updates
  // ---------------------------------------------------------------------------

  const updateIndividualSchedule = (patientId, field, value) => {
    setIndividualSchedules((current) => ({
      ...current,
      [patientId]: {
        ...current[patientId],
        [field]: value,
      },
    }));
  };


  // ---------------------------------------------------------------------------
  // Continue to review
  // ---------------------------------------------------------------------------

  const continueToReview = () => {
    if (selectedPatientList.length === 0) {
      setToast({
        open: true,
        message: "Please select at least one patient.",
        severity: "warning",
      });

      return;
    }

    let schedules = [];

    // -------------------------------------------------------------------------
    // BULK MODE
    // -------------------------------------------------------------------------

    if (scheduleMode === "bulk") {
      if (!bulkDate || !bulkTime) {
        setToast({
          open: true,
          message: "Please select both appointment date and time.",
          severity: "warning",
        });

        return;
      }

      schedules = selectedPatientList.map((patient) => ({
        patientId: patient.id,
        patientName: patient.name,
        opNo: patient.opNo,
        mobile: patient.mobile,
        unit: patient.unit,
        appointmentDate: bulkDate,
        appointmentTime: bulkTime,
      }));
    }

    // -------------------------------------------------------------------------
    // INDIVIDUAL MODE
    // -------------------------------------------------------------------------

    if (scheduleMode === "individual") {
      const incompletePatient = selectedPatientList.find((patient) => {
        const schedule = individualSchedules[patient.id];

        return !schedule?.date || !schedule?.time;
      });

      if (incompletePatient) {
        setToast({
          open: true,
          message: `Please select date and time for ${incompletePatient.name}.`,
          severity: "warning",
        });

        return;
      }

      schedules = selectedPatientList.map((patient) => ({
        patientId: patient.id,
        patientName: patient.name,
        opNo: patient.opNo,
        mobile: patient.mobile,
        unit: patient.unit,
        appointmentDate: individualSchedules[patient.id].date,
        appointmentTime: individualSchedules[patient.id].time,
      }));
    }

    setReviewAppointments(schedules);

    setScheduleDialogOpen(false);
    setReviewDialogOpen(true);
  };


  // ---------------------------------------------------------------------------
  // Edit schedules from review
  // ---------------------------------------------------------------------------

  const editSchedules = () => {
    setReviewDialogOpen(false);
    setScheduleDialogOpen(true);
  };


  // ---------------------------------------------------------------------------
  // Confirm appointments + WhatsApp queue
  // ---------------------------------------------------------------------------


const confirmAndSendMessages = async () => {
  if (reviewAppointments.length === 0 || sendingMessages) {
    return;
  }

  setSendingMessages(true);

  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://10.0.9.188:5008";

    const appointmentsToSend = reviewAppointments.map((appointment) => ({
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      mobile: String(appointment.mobile || "").trim(),
      appointmentDate: formatDate(appointment.appointmentDate),
      appointmentTime: formatTime(appointment.appointmentTime),
    }));

    const response = await fetch(
      `${apiBaseUrl}/api/whatsapp/send-appointments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointments: appointmentsToSend,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to process WhatsApp messages."
      );
    }

    const resultsByPatientId = new Map(
      (data.results || []).map((result) => [
        String(result.patientId),
        result,
      ])
    );

    const timestamp = Date.now();

    const newAppointments = reviewAppointments.map(
      (appointment, index) => {
        const result = resultsByPatientId.get(
          String(appointment.patientId)
        );

        return {
          id: timestamp + index,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          uhid: appointment.uhid,
          mobile: appointment.mobile,
          unit: appointment.unit,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          status: "Scheduled",
          whatsappStatus: result
            ? result.success
              ? "Accepted"
              : "Failed"
            : "Failed",
          createdAt: new Date().toISOString(),
        };
      }
    );

    setAppointments((current) => [
      ...current,
      ...newAppointments,
    ]);

    const successful = newAppointments.filter(
      (appointment) => appointment.whatsappStatus === "Accepted"
    ).length;

    const failed = newAppointments.length - successful;

    setReviewDialogOpen(false);
    setSelectedPatients([]);
    setReviewAppointments([]);

    setToast({
      open: true,
      message: `${successful} WhatsApp request(s) accepted, ${failed} failed.`,
      severity: failed === 0 ? "success" : "warning",
    });
  } catch (error) {
    console.error("Error sending WhatsApp messages:", error);

    setToast({
      open: true,
      message:
        error.message || "Unable to send WhatsApp messages.",
      severity: "error",
    });
  } finally {
    setSendingMessages(false);
  }
};



  // ---------------------------------------------------------------------------
  // Reset current view
  // ---------------------------------------------------------------------------

  const resetView = () => {
    setSelectedUnit("All Units");
    setSearch("");
    setSelectedPatients([]);

    setScheduleDialogOpen(false);
    setReviewDialogOpen(false);

    setBulkDate("");
    setBulkTime("");
    setIndividualSchedules({});
    setReviewAppointments([]);
  };





  useEffect(() => {
  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      setPatientError("");

      const response = await fetch("http://10.0.9.188:5008/api/patients");

      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }

      const data = await response.json();

      const formattedPatients = data.patients.map((patient) => ({
        id: patient.PatientID,
        uhid: patient.UHID,
        name: patient.PatientName,
        gender: patient.Gender,
        mobile: patient.Mobile,
        unit: patient.UnitName,
        status: patient.Status,
      }));

      setPatients(formattedPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatientError("Unable to load patients from the server.");
    } finally {
      setLoadingPatients(false);
    }
  };

  fetchPatients();
}, []);



  return (
    <Box className="app-shell">

      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}

      <Box className="topbar">
        <Container maxWidth="xl">
          <Box className="topbar-content">

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
            >
              <Box className="brand-icon">
                <LocalHospitalRounded />
              </Box>

              <Box>
                <Typography className="brand-title">
                  Dialysis Appointment System
                </Typography>

                <Typography className="brand-subtitle">
                  Patient scheduling & WhatsApp notifications
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={resetView}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
              }}
            >
              Reset View
            </Button>

          </Box>
        </Container>
      </Box>


      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}

      <Container
        maxWidth="xl"
        sx={{ py: 3 }}
      >

        {/* ================================================================ */}
        {/* SUMMARY CARDS */}
        {/* ================================================================ */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
            mb: 3,
          }}
        >

          <Paper className="summary-card">
            <Box className="summary-icon">
              <GroupsRounded />
            </Box>

            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Patients
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ mt: 0.5 }}
              >
                {patients.length}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Registered dialysis patients
              </Typography>
            </Box>
          </Paper>


          <Paper className="summary-card">
            <Box className="summary-icon">
              <EventAvailableRounded />
            </Box>

            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Appointments Scheduled
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ mt: 0.5 }}
              >
                {scheduledCount}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Current appointment records
              </Typography>
            </Box>
          </Paper>


          <Paper className="summary-card">
            <Box className="summary-icon">
              <WhatsApp />
            </Box>

            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Failed WhatsApp Messages
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ mt: 0.5 }}
              >
                {queuedCount}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Messages ready for API
              </Typography>
            </Box>
          </Paper>

        </Box>


        {/* ================================================================ */}
        {/* FILTER PANEL */}
        {/* ================================================================ */}

        <Paper className="control-panel">

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
          >

            <FormControl
              size="small"
              sx={{
                minWidth: {
                  xs: "100%",
                  md: 300,
                },
              }}
            >
              <InputLabel>Dialysis Unit</InputLabel>

              <Select
                value={selectedUnit}
                label="Dialysis Unit"
                onChange={(event) =>
                  setSelectedUnit(event.target.value)
                }
              >
                {units.map((unit) => (
                  <MenuItem
                    key={unit}
                    value={unit}
                  >
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>


            <TextField
              size="small"
              fullWidth
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search patient, OP/IP number or mobile"
              InputProps={{
                startAdornment: (
                  <SearchRounded
                    sx={{
                      mr: 1,
                      color: "text.secondary",
                    }}
                  />
                ),
              }}
            />

          </Stack>

        </Paper>


        {/* ================================================================ */}
        {/* PATIENT LIST */}
        {/* ================================================================ */}

        <Paper className="schedule-panel">

          <Box className="panel-heading">

              {/* <Box className="panel-footer"> */}

            {/* <Box>
              <Typography
                variant="body2"
                fontWeight={700}
              >
                {selectedPatients.length > 0
                  ? `${selectedPatients.length} patient${
                      selectedPatients.length > 1
                        ? "s"
                        : ""
                    } selected`
                  : "No patients selected"}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Choose patients and schedule their appointments.
              </Typography>
            </Box> */}


            

          {/* </Box> */}



            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
              >
                Patient List
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.4 }}
              >
                Select patients to schedule their dialysis appointments.
              </Typography>

              <Typography
                variant="body2"
                fontWeight={700}
              >
                {selectedPatients.length > 0
                  ? `${selectedPatients.length} patient${
                      selectedPatients.length > 1
                        ? "s"
                        : ""
                    } selected`
                  : "No patients selected"}
              </Typography>

              {/* <Typography
                variant="caption"
                color="text.secondary"
              >
                Choose patients and schedule their appointments.
              </Typography> */}
            </Box>

            <Box sx={{ mt: 1, display: "flex",flexDirection: "column", gap: 1, flexWrap: "wrap" }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >

                <Chip
                  label={`${selectedPatients.length} selected`}
                  color={
                    selectedPatients.length > 0
                      ? "primary"
                      : "default"
                  }
                  variant={
                    selectedPatients.length > 0
                      ? "filled"
                      : "outlined"
                  }
                />

                <Button
                  size="small"
                  onClick={selectAllVisible}
                  disabled={filteredPatients.length === 0}
                  sx={{
                    textTransform: "none",
                  }}
                >
                  Select All
                </Button>

                <Button
                  size="small"
                  onClick={clearSelection}
                  disabled={selectedPatients.length === 0}
                  sx={{
                    textTransform: "none",
                  }}
                >
                  Clear
                </Button>

              </Stack>

              <Button
                variant="contained"
                size="large"
                startIcon={<CalendarMonthRounded />}
                onClick={openScheduleDialog}
                disabled={selectedPatients.length === 0}
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                }}
              >
                Schedule Selected Patients
              </Button>
            </Box>
            
                
          </Box>


          <Divider />


          <Box className="patient-list">

            {loadingPatients ? (
              <div className="empty-state">
                <CircularProgress size={32} />
                <Typography variant="body2">
                  Loading patients...
                </Typography>
              </div>
            ) : patientError ? (
              <div className="empty-state">
                <Typography color="error">
                  {patientError}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) :filteredPatients.length === 0 ? (

              <Box className="empty-state">

                <PersonRounded
                  sx={{
                    fontSize: 42,
                    color: "#cbd5e1",
                  }}
                />

                <Typography
                  fontWeight={700}
                  color="text.secondary"
                >
                  No patients found
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Try changing the unit or search term.
                </Typography>

              </Box>

            ) : (

              filteredPatients.map((patient) => {

                const isSelected =
                  selectedPatients.includes(patient.id);

                const patientAppointments =
                  appointments.filter(
                    (appointment) =>
                      appointment.patientId === patient.id
                  );

                return (
                  <Box
                    key={patient.id}
                    className={`patient-row ${
                      isSelected
                        ? "patient-row-selected"
                        : ""
                    }`}
                  >

                    <Box className="patient-main">

                      <input
                        type="checkbox"
                        className="patient-checkbox"
                        checked={isSelected}
                        onChange={() =>
                          togglePatient(patient.id)
                        }
                      />

                      <Avatar className="patient-avatar">
                        {getInitials(patient.name)}
                      </Avatar>


                      <Box sx={{ minWidth: 0 }}>

                        <Typography
                          fontWeight={750}
                          noWrap
                        >
                          {patient.name}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mt: 0.4 }}
                        >

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {patient.opNo}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            •
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {patient.mobile}
                          </Typography>

                        </Stack>

                      </Box>

                    </Box>


                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      justifyContent="flex-end"
                    >

                      <Chip
                        size="small"
                        label={patient.unit}
                        variant="outlined"
                      />

                      {patientAppointments.length > 0 && (
                        <Chip
                          size="small"
                          icon={
                            <EventAvailableRounded />
                          }
                          label={`${patientAppointments.length} scheduled`}
                          color="success"
                          variant="outlined"
                        />
                      )}

                    </Stack>

                  </Box>
                );
              })

            )}

          </Box>


          {/* ============================================================ */}
          {/* FOOTER */}
          {/* ============================================================ */}

          <Divider />

          <Box className="panel-footer">

            <Box>
              <Typography
                variant="body2"
                fontWeight={700}
              >
                {selectedPatients.length > 0
                  ? `${selectedPatients.length} patient${
                      selectedPatients.length > 1
                        ? "s"
                        : ""
                    } selected`
                  : "No patients selected"}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Choose patients and schedule their appointments.
              </Typography>
            </Box>


            <Button
              variant="contained"
              size="large"
              startIcon={<CalendarMonthRounded />}
              onClick={openScheduleDialog}
              disabled={selectedPatients.length === 0}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
                px: 3,
              }}
            >
              Schedule Selected Patients
            </Button>

          </Box>

        </Paper>

      </Container>


      {/* ================================================================== */}
      {/* SCHEDULING DIALOG */}
      {/* ================================================================== */}

      <Dialog
        open={scheduleDialogOpen}
        onClose={closeScheduleDialog}
        fullWidth
        maxWidth="md"
      >

        <DialogTitle sx={{ pb: 1 }}>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={2}
          >

            <Box>

              <Typography
                variant="h6"
                fontWeight={800}
              >
                Schedule Appointment
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Scheduling {selectedPatientList.length} patient
                {selectedPatientList.length !== 1 ? "s" : ""}
              </Typography>

            </Box>


            <Button
              onClick={closeScheduleDialog}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                borderRadius: 2,
              }}
            >
              <CloseRounded />
            </Button>

          </Stack>

        </DialogTitle>


        <DialogContent dividers>

          {/* ------------------------------------------------------------ */}
          {/* Scheduling mode */}
          {/* ------------------------------------------------------------ */}

          <Box
            sx={{
              mb: 3,
              p: 2,
              border: "1px solid #e8edf3",
              borderRadius: 3,
              background: "#fbfcfe",
            }}
          >

            <Typography
              fontWeight={750}
              sx={{ mb: 1 }}
            >
              Scheduling Method
            </Typography>

            <RadioGroup
              value={scheduleMode}
              onChange={(event) =>
                setScheduleMode(event.target.value)
              }
            >

              <FormControlLabel
                value="bulk"
                control={<Radio />}
                label={
                  <Box>
                    <Typography fontWeight={650}>
                      Same Date & Time for All
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Use this for a group of patients having
                      the same dialysis slot.
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                value="individual"
                control={<Radio />}
                label={
                  <Box>
                    <Typography fontWeight={650}>
                      Individual Date & Time
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Set a different appointment for each
                      selected patient.
                    </Typography>
                  </Box>
                }
              />

            </RadioGroup>

          </Box>


          {/* ------------------------------------------------------------ */}
          {/* BULK MODE */}
          {/* ------------------------------------------------------------ */}

          {scheduleMode === "bulk" && (

            <Box>

              <Typography
                fontWeight={750}
                sx={{ mb: 2 }}
              >
                Common Appointment
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >

                <TextField
                  label="Appointment Date"
                  type="date"
                  fullWidth
                  value={bulkDate}
                  onChange={(event) =>
                    setBulkDate(event.target.value)
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />

                <TextField
                  label="Appointment Time"
                  type="time"
                  fullWidth
                  value={bulkTime}
                  onChange={(event) =>
                    setBulkTime(event.target.value)
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />

              </Box>


              <Box sx={{ mt: 3 }}>

                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ mb: 1 }}
                >
                  Selected Patients
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                >
                  {selectedPatientList.map((patient) => (
                    <Chip
                      key={patient.id}
                      avatar={
                        <Avatar>
                          {getInitials(patient.name)}
                        </Avatar>
                      }
                      label={patient.name}
                    />
                  ))}
                </Stack>

              </Box>

            </Box>
          )}


          {/* ------------------------------------------------------------ */}
          {/* INDIVIDUAL MODE */}
          {/* ------------------------------------------------------------ */}

          {scheduleMode === "individual" && (

            <Box>

              <Typography
                fontWeight={750}
                sx={{ mb: 2 }}
              >
                Individual Appointments
              </Typography>

              <Stack spacing={1.5}>

                {selectedPatientList.map((patient) => {

                  const schedule =
                    individualSchedules[patient.id] || {
                      date: "",
                      time: "",
                    };

                  return (
                    <Paper
                      key={patient.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                      }}
                    >

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "1.3fr 1fr 1fr",
                          },
                          gap: 2,
                          alignItems: "center",
                        }}
                      >

                        {/* Patient */}

                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >

                          <Avatar className="patient-avatar">
                            {getInitials(patient.name)}
                          </Avatar>

                          <Box>

                            <Typography
                              fontWeight={700}
                            >
                              {patient.name}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {patient.opNo} • {patient.unit}
                            </Typography>

                          </Box>

                        </Stack>


                        {/* Date */}

                        <TextField
                          label="Date"
                          type="date"
                          size="small"
                          fullWidth
                          value={schedule.date}
                          onChange={(event) =>
                            updateIndividualSchedule(
                              patient.id,
                              "date",
                              event.target.value
                            )
                          }
                          slotProps={{
                            inputLabel: {
                              shrink: true,
                            },
                          }}
                        />


                        {/* Time */}

                        <TextField
                          label="Time"
                          type="time"
                          size="small"
                          fullWidth
                          value={schedule.time}
                          onChange={(event) =>
                            updateIndividualSchedule(
                              patient.id,
                              "time",
                              event.target.value
                            )
                          }
                          slotProps={{
                            inputLabel: {
                              shrink: true,
                            },
                          }}
                        />

                      </Box>

                    </Paper>
                  );
                })}

              </Stack>

            </Box>
          )}

        </DialogContent>


        <DialogActions sx={{ p: 2 }}>

          <Button
            onClick={closeScheduleDialog}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={<CheckCircleRounded />}
            onClick={continueToReview}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            Continue to Review
          </Button>

        </DialogActions>

      </Dialog>


      {/* ================================================================== */}
      {/* APPOINTMENT REVIEW DIALOG */}
      {/* ================================================================== */}

      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >

        <DialogTitle sx={{ pb: 1 }}>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={2}
          >

            <Box>

              <Typography
                variant="h6"
                fontWeight={800}
              >
                Appointment Review
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Please verify the appointment details before
                sending WhatsApp notifications.
              </Typography>

            </Box>


            <Button
              onClick={() => setReviewDialogOpen(false)}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                borderRadius: 2,
              }}
            >
              <CloseRounded />
            </Button>

          </Stack>

        </DialogTitle>


        <DialogContent dividers>

          <Alert
            severity="info"
            sx={{
              mb: 2.5,
              borderRadius: 2.5,
            }}
          >
            Each patient will receive a WhatsApp message
            containing their appointment's date and time.
          </Alert>


          <Stack spacing={1.5}>

            {reviewAppointments.map((appointment) => (

              <Paper
                key={appointment.patientId}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                }}
              >

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1.5fr 1fr 1fr",
                    },
                    gap: 2,
                    alignItems: "center",
                  }}
                >

                  {/* Patient */}

                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >

                    <Avatar className="patient-avatar">
                      {getInitials(
                        appointment.patientName
                      )}
                    </Avatar>

                    <Box>

                      <Typography fontWeight={750}>
                        {appointment.patientName}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {appointment.opNo} •{" "}
                        {appointment.mobile}
                      </Typography>

                    </Box>

                  </Stack>


                  {/* Date */}

                  <Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Appointment Date
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={0.7}
                      alignItems="center"
                      sx={{ mt: 0.4 }}
                    >

                      <CalendarMonthRounded
                        sx={{
                          fontSize: 18,
                          color: "#0f766e",
                        }}
                      />

                      <Typography
                        fontWeight={700}
                      >
                        {formatDate(
                          appointment.appointmentDate
                        )}
                      </Typography>

                    </Stack>

                  </Box>


                  {/* Time */}

                  <Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Appointment Time
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={0.7}
                      alignItems="center"
                      sx={{ mt: 0.4 }}
                    >

                      <AccessTimeRounded
                        sx={{
                          fontSize: 18,
                          color: "#0f766e",
                        }}
                      />

                      <Typography
                        fontWeight={700}
                      >
                        {formatTime(
                          appointment.appointmentTime
                        )}
                      </Typography>

                    </Stack>

                  </Box>

                </Box>


                {/* WhatsApp preview */}

                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 2,
                    background: "#f7faf9",
                    border: "1px solid #e5efec",
                  }}
                >

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 0.7 }}
                  >

                    <WhatsApp
                      sx={{
                        fontSize: 18,
                        color: "#0f766e",
                      }}
                    />

                    <Typography
                      variant="caption"
                      fontWeight={750}
                    >
                      WhatsApp Message Preview
                    </Typography>

                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: "pre-line",
                      lineHeight: 1.6,
                    }}
                  >
                    {getWhatsAppMessage(appointment)}
                  </Typography>

                </Box>

              </Paper>

            ))}

          </Stack>

        </DialogContent>


        <DialogActions
          sx={{
            p: 2,
            justifyContent: "space-between",
          }}
        >

          <Button
            variant="outlined"
            onClick={editSchedules}
            sx={{
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Edit Schedule
          </Button>


          <Button
            variant="contained"
            color="success"
            startIcon={<SendRounded />}
            onClick={confirmAndSendMessages}
            disabled={sendingMessages}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            {sendingMessages
            ? "Sending Messages..."
            : "Confirm & Send WhatsApp"}
          </Button>

        </DialogActions>

      </Dialog>


      {/* ================================================================== */}
      {/* TOAST */}
      {/* ================================================================== */}

      {toast.open && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1500,
            maxWidth: {
              xs: "calc(100% - 32px)",
              sm: 450,
            },
          }}
        >

          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() =>
              setToast((current) => ({
                ...current,
                open: false,
              }))
            }
            sx={{
              borderRadius: 2.5,
              boxShadow:
                "0 10px 30px rgba(15, 23, 42, 0.18)",
            }}
          >
            {toast.message}
          </Alert>

        </Box>
      )}

    </Box>
  );
}