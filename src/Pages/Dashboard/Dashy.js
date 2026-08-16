import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  ChevronRight,
  Calendar,
  AlertCircle,
  Clock,
  Plus,
  ArrowUpRight,
  FileText,
  Building,
  Video,
} from 'lucide-react';
import CustomIcons from '../../components/icons/CustomIcons';

import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';
import { STATUS_LABELS } from '../../components/common/StatusBadge';
import {
  formatDeadline,
  formatDateTime,
  formatRelativeTime,
} from '../../lib/simulate';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    applications,
    requiredDocuments,
    upcomingAppointments,
    activityFeed,
    tasks,
    isTaskUnlocked,
  } = useAppData();

  const submittedApplications = applications.filter((app) => app.status !== 'draft');
  const offers = applications.filter((app) => app.status === 'offer');
  const pendingDocuments = requiredDocuments.filter((doc) => doc.status !== 'approved');
  const nextAppointment = upcomingAppointments[0] ?? null;

  // Priority tasks are the next unlocked, incomplete milestones by due date.
  const priorityTasks = tasks
    .filter((task) => !task.completed && isTaskUnlocked(task))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  const handleAppointmentAction = () => {
    if (!nextAppointment) {
      navigate('/appointments');
      return;
    }
    if (nextAppointment.mode === 'Video call') {
      // No real meeting link exists in this static build.
      showToast(
        `Meeting link for ${nextAppointment.meetingType} will be shared 15 minutes before the call.`,
        'info'
      );
      return;
    }
    navigate('/appointments');
  };

  const applicationStages = [
    {
      key: 'applications',
      label: 'Applications submitted',
      count: submittedApplications.length,
      lines: submittedApplications.slice(0, 2).map((app) => ({
        icon: <Building className="w-3 h-3" />,
        text: app.universityName,
      })),
      icon: <CustomIcons iconType="application" size={30} color="#42A5F5" />,
      secondaryIcon: <Building className="w-4 h-4 text-blue-400" />,
      actionIcon: <FileText className="w-4 h-4" />,
      buttonText: 'View Applications',
      onAction: () => navigate('/applications'),
      stats: `Target: ${applications.length} universities`,
    },
    {
      key: 'offers',
      label: 'Offers received',
      count: offers.length,
      lines: offers.slice(0, 2).map((app) => ({
        icon: <Building className="w-3 h-3" />,
        text: app.universityName,
      })),
      icon: <CustomIcons iconType="offerReceived" size={30} color="#66BB6A" />,
      secondaryIcon: <ArrowUpRight className="w-4 h-4 text-green-400" />,
      actionIcon: <MessageSquare className="w-4 h-4" />,
      buttonText: 'View Offers',
      onAction: () => navigate('/applications'),
      stats: submittedApplications.length
        ? `Acceptance rate: ${Math.round((offers.length / submittedApplications.length) * 100)}%`
        : 'No applications submitted yet',
    },
    {
      key: 'documents',
      label: 'Pending documents',
      count: pendingDocuments.length,
      lines: pendingDocuments.slice(0, 3).map((doc) => ({
        icon: <FileText className="w-3 h-3" />,
        text: doc.title,
      })),
      icon: <CustomIcons iconType="pendingDocument" size={30} color="#FFA726" />,
      secondaryIcon: <Clock className="w-4 h-4 text-orange-400" />,
      actionIcon: <Plus className="w-4 h-4" />,
      buttonText: 'Upload Documents',
      onAction: () => navigate('/documents'),
      stats: pendingDocuments.length ? 'Required before submission' : 'All required documents in',
    },
    {
      // Replaces the former "Visa applications" card.
      key: 'appointments',
      label: 'Upcoming appointments',
      count: upcomingAppointments.length,
      lines: nextAppointment
        ? [
            { icon: <Calendar className="w-3 h-3" />, text: formatDateTime(nextAppointment.scheduledAt) },
            { icon: <MessageSquare className="w-3 h-3" />, text: nextAppointment.counsellorName },
            { icon: <Video className="w-3 h-3" />, text: nextAppointment.meetingType },
          ]
        : [],
      icon: <CustomIcons iconType="application" size={30} color="#AB47BC" />,
      secondaryIcon: <Calendar className="w-4 h-4 text-purple-400" />,
      actionIcon: <Video className="w-4 h-4" />,
      buttonText: nextAppointment?.mode === 'Video call' ? 'Join Meeting' : 'View Details',
      onAction: handleAppointmentAction,
      stats: nextAppointment
        ? `Status: ${STATUS_LABELS[nextAppointment.status] ?? nextAppointment.status}`
        : 'No meetings scheduled',
    },
  ];

  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <motion.div
        className="flex-1 p-4 lg:p-6 bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Welcome Section */}
        <motion.div
          className="bg-white shadow-md rounded-lg p-6 mb-6 mt-6"
          {...fadeIn}
          whileHover={{ boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
        >
          <h1 className="text-2xl font-bold">Hi, {user?.fullName}!</h1>
          <p className="text-gray-600">
            Welcome back, Ignite your Study Abroad Journey !!
          </p>
        </motion.div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Application Progress Section */}
          <motion.div
            className="bg-white rounded-lg shadow p-6"
            {...fadeIn}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Application Progress</h2>
              <Link
                to="/applications"
                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                View Details
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {applicationStages.map((stage, index) => (
                <motion.div
                  key={stage.key}
                  className="p-4 border rounded-lg hover:shadow-md transition-all flex flex-col justify-between"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="p-2 bg-gray-50 rounded-lg"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          {stage.icon}
                        </motion.div>
                        {stage.secondaryIcon}
                      </div>
                      <span className="text-2xl font-bold">{stage.count}</span>
                    </div>
                    <p className="text-sm font-medium mb-2">{stage.label}</p>
                    <div className="mb-3">
                      {stage.lines.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {stage.lines.map((line, i) => (
                            <div key={i} className="flex items-center gap-1">
                              {line.icon}
                              {line.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">{stage.stats}</div>
                  </div>
                  <motion.button
                    onClick={stage.onAction}
                    className="mt-auto px-3 py-2 text-sm bg-gray-50 text-gray-700 border rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {stage.actionIcon}
                    {stage.buttonText}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Priority Tasks and Recent Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Tasks */}
            <motion.div
              className="lg:col-span-2 bg-white rounded-lg shadow p-6"
              {...fadeIn}
            >
              <h2 className="text-lg font-semibold mb-4">Priority Tasks</h2>
              {priorityTasks.length === 0 ? (
                <EmptyState
                  title="Nothing outstanding"
                  description="Every unlocked checklist task is complete. Nice work."
                />
              ) : (
                <div className="space-y-4">
                  {priorityTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      className="p-4 border rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            index === 0
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {formatDeadline(task.dueDate)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Recent Updates */}
            <motion.div
              className="bg-white rounded-lg shadow p-6"
              {...fadeIn}
            >
              <h2 className="text-lg font-semibold mb-4">Recent Updates</h2>
              {activityFeed.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Actions you take across the portal show up here."
                />
              ) : (
                <div className="space-y-4">
                  {activityFeed.slice(0, 5).map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 border-b last:border-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                      </motion.div>
                      <div>
                        <p className="text-sm">{entry.message}</p>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
