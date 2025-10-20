// TEAMFPSCRUDDjangoReact/src/pages/Dashboard.tsx

import * as api from "../api";

import { Box, Container, Grid, Paper, Tab, Tabs, Typography } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import ConfirmDialog from "../components/ConfirmDialog";
import StudentForm from "../components/StudentForm";
import StudentList from "../components/StudentList";
import SubjectForm from "../components/SubjectForm";
import SubjectList from "../components/SubjectList";

type Props = {
  token: string | null;
  showSnack: (message: string, severity?: "success" | "info" | "error") => void;
};

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    "aria-controls": `dashboard-tabpanel-${index}`,
  };
}

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`dashboard-tabpanel-${index}`} aria-labelledby={`dashboard-tab-${index}`}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard({ token, showSnack }: Props) {
  const [subjects, setSubjects] = useState<api.Subject[]>([]);
  const [students, setStudents] = useState<api.Student[]>([]);
  const [loading, setLoading] = useState(false);

  const [confirmDeleteSubjectId, setConfirmDeleteSubjectId] = useState<string | number | null>(null);
  const [confirmDeleteStudentId, setConfirmDeleteStudentId] = useState<string | number | null>(null);

  const [tabIndex, setTabIndex] = useState<number>(0);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, userRes] = await Promise.allSettled([api.fetchSubjects(token || undefined), api.fetchUsers(token || undefined)]);
      if (subRes.status === "fulfilled") setSubjects(subRes.value);
      if (userRes.status === "fulfilled") {
        setStudents((userRes.value as api.Student[]).filter((u) => !u.is_staff && !u.is_admin));
      }
    } catch (err) {
      // ignore - per-call errors handled below
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadAll();
    else {
      setSubjects([]);
      setStudents([]);
    }
  }, [token, loadAll]);

  // Add subject
  const handleAddSubject = useCallback(
    async (name: string) => {
      try {
        const created = await api.createSubject({ name }, token || undefined);
        setSubjects((s) => [created, ...s]);
        showSnack("Subject added", "success");
      } catch (err: any) {
        try {
          const text = await err?.text?.();
          showSnack(`Add failed: ${text || String(err)}`, "error");
        } catch {
          showSnack(`Add failed`, "error");
        }
      }
    },
    [token, showSnack]
  );

  // Delete subject (confirm prior)
  const confirmDeleteSubject = useCallback((id: string | number) => setConfirmDeleteSubjectId(id), []);
  const doDeleteSubject = useCallback(async () => {
    if (confirmDeleteSubjectId == null) return;
    try {
      await api.deleteSubject(confirmDeleteSubjectId, token || undefined);
      setSubjects((s) => s.filter((x) => String(x.id) !== String(confirmDeleteSubjectId)));
      showSnack("Subject deleted", "info");
    } catch (err) {
      try {
        const text = await err?.text?.();
        showSnack(`Delete failed: ${text || String(err)}`, "error");
      } catch {
        showSnack("Delete failed", "error");
      }
    } finally {
      setConfirmDeleteSubjectId(null);
    }
  }, [confirmDeleteSubjectId, token, showSnack]);

  // Students
  const handleAddStudent = useCallback(
    async (payload: { email: string; password: string; first_name?: string; last_name?: string }) => {
      try {
        const created = await api.createUser(payload, token || undefined);
        if (!created.is_staff && !created.is_admin) setStudents((s) => [created, ...s]);
        showSnack("Student created", "success");
      } catch (err) {
        try {
          const text = await err?.text?.();
          showSnack(`Create failed: ${text || String(err)}`, "error");
        } catch {
          showSnack("Create failed", "error");
        }
      }
    },
    [token, showSnack]
  );

  const confirmDeleteStudent = useCallback((id: string | number) => setConfirmDeleteStudentId(id), []);
  const doDeleteStudent = useCallback(async () => {
    if (confirmDeleteStudentId == null) return;
    try {
      await api.deleteUser(confirmDeleteStudentId, token || undefined);
      setStudents((s) => s.filter((x) => String(x.id) !== String(confirmDeleteStudentId)));
      showSnack("Student deleted", "info");
    } catch (err) {
      try {
        const text = await err?.text?.();
        showSnack(`Delete failed: ${text || String(err)}`, "error");
      } catch {
        showSnack("Delete failed", "error");
      }
    } finally {
      setConfirmDeleteStudentId(null);
    }
  }, [confirmDeleteStudentId, token, showSnack]);

  const subjectCount = useMemo(() => subjects.length, [subjects]);
  const studentCount = useMemo(() => students.length, [students]);

  return (
    <Box>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="Subjects and Students tabs" centered>
            <Tab label={`Subjects (${subjectCount})`} {...a11yProps(0)} />
            <Tab label={`Students (${studentCount})`} {...a11yProps(1)} />
          </Tabs>
        </Paper>

        <TabPanel value={tabIndex} index={0}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            Subjects
          </Typography>

          <Box sx={{ mt: 2, mb: 3 }}>
            <SubjectForm onAdd={handleAddSubject} disabled={loading} />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
              Subject List ({subjectCount})
            </Typography>
            <SubjectList subjects={subjects} onDelete={(id) => confirmDeleteSubject(id)} />
          </Box>
        </TabPanel>

        <TabPanel value={tabIndex} index={1}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Students
          </Typography>

          <Box sx={{ mt: 2, mb: 3 }}>
            <StudentForm onAdd={handleAddStudent} disabled={loading} />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
              Student List ({studentCount})
            </Typography>
            <StudentList students={students} onDelete={(id) => confirmDeleteStudent(id)} />
          </Box>
        </TabPanel>
      </Container>

      <ConfirmDialog
        open={confirmDeleteSubjectId != null}
        title="Delete subject"
        message="Are you sure you want to delete this subject? This action cannot be undone."
        onClose={() => setConfirmDeleteSubjectId(null)}
        onConfirm={doDeleteSubject}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={confirmDeleteStudentId != null}
        title="Delete student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        onClose={() => setConfirmDeleteStudentId(null)}
        onConfirm={doDeleteStudent}
        confirmLabel="Delete"
      />
    </Box>
  );
}