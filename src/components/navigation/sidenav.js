import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Globe,
  Users,
  Settings,
  HelpCircle,
  Bell,
  Menu,
  FileCheck,
  DollarSign,
  X,
  CalendarClock,
  ListChecks,
  Bot,
  LogOut,
  FolderPlusIcon,
  Camera,
  UserCircle,
  MessageCircle,
  Compass,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

import logo from "../../assets/logo.png";

import navigationItems from "../../data/navigation.json";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import { useDashboardTour } from "../../context/TourContext";
import { formatDeadline, formatRelativeTime } from "../../lib/simulate";
import IgnitionMark from "../common/IgnitionMark";

const PremiumNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  // Null on screens rendered outside the tour provider — the hook is
  // deliberately non-throwing for exactly this reason.
  const tour = useDashboardTour();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    unreadMessageCount,
    tasks,
    isTaskUnlocked,
  } = useAppData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPriorityTasks, setShowPriorityTasks] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const priorityTasksRef = useRef(null);
  const sidebarRef = useRef(null);
  const fileInputRef = useRef(null);

  const priorityTasks = tasks
    .filter((task) => !task.completed && isTaskUnlocked(task))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const activeItem = location.pathname;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        priorityTasksRef.current &&
        !priorityTasksRef.current.contains(event.target)
      ) {
        setShowPriorityTasks(false);
      }
    };

    const handleKeyboard = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setShowNotifications(false);
        setShowPriorityTasks(false);
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  // A tour step that points at the sidebar has to open it first on mobile,
  // where it is an off-canvas drawer. The request carries a sequence number so
  // asking for the same state twice still re-opens it.
  const navDrawerRequest = tour?.navDrawerRequest;
  useEffect(() => {
    if (!navDrawerRequest) return;
    setIsSidebarOpen(navDrawerRequest.open);
  }, [navDrawerRequest]);

  // The chosen file never leaves the browser — we only keep an object URL for
  // the preview and hold it in the simulated session.
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ show: true, message: "File size should be less than 5MB", type: "error" });
      return;
    }

    setIsUploadingPhoto(true);
    const previewURL = URL.createObjectURL(file);
    updateUser({ profileImage: previewURL });

    // Artificial delay so the loading state is visible.
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsUploadingPhoto(false);
    setAlert({ show: true, message: "Photo updated successfully!", type: "success" });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
  };

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const iconsMap = {
    home: Home,
    courseSearch: Search,
    myApplications: FileCheck,
    appointments: CalendarClock,
    chat: MessageCircle,
    tasks: ListChecks,
    interviews: Bot,
    visaStatus: Globe,
    countryGuide: Globe,
    community: Users,
    settings: Settings,
    helpCenter: HelpCircle,
    myFinance: DollarSign,
    document: FolderPlusIcon,
  };

  const CustomNavigationIcons = ({ name, ...props }) => {
    const IconComponent = iconsMap[name];
    return IconComponent ? <IconComponent {...props} /> : null;
  };

  const getAnimationDelay = (index) => `${index * 50}ms`;

  return (
    <>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-16 bg-white z-[60] flex items-center justify-between px-4 transition-all duration-500
        ${isScrolled ? "shadow-lg border-b border-slate-100" : "shadow-sm border-b border-transparent"}`}
      >
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg hover:bg-navy-50 lg:hidden relative z-[70] text-navy-900"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          >
            {isSidebarOpen ? (
              <X size={20} className="transition-all duration-300" />
            ) : (
              <Menu size={20} className="transition-all duration-300" />
            )}
          </button>
          <span className="relative z-[70]">
            <IgnitionMark size="sm" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Tasks */}
          <div className="relative" ref={priorityTasksRef} data-tour="priority-tasks">
            <button
              className="relative p-2 rounded-full text-slate-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
              onClick={() => setShowPriorityTasks(!showPriorityTasks)}
              aria-label="Priority tasks"
            >
              <ListChecks className="h-6 w-6" />
              {priorityTasks.length > 0 && (
                <span className="absolute top-0 right-0 bg-ignite-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {priorityTasks.length}
                </span>
              )}
            </button>

            {showPriorityTasks && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-navy-900">Priority Tasks</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {priorityTasks.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      Nothing outstanding
                    </div>
                  ) : (
                    priorityTasks.slice(0, 6).map((task) => (
                      <Link
                        key={task.id}
                        to="/tasks"
                        onClick={() => setShowPriorityTasks(false)}
                        className="block w-full text-left p-4 border-b border-slate-100 last:border-0 hover:bg-navy-50/60"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-navy-900">{task.title}</h4>
                          {task.dueDate && (
                            <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                              {formatDeadline(task.dueDate)}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        )}
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-slate-100 text-center">
                  <Link
                    to="/tasks"
                    onClick={() => setShowPriorityTasks(false)}
                    className="text-sm font-medium text-navy-700 hover:text-navy-900"
                  >
                    View all tasks
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef} data-tour="notifications">
            <button
              className="relative p-2 rounded-full text-slate-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-navy-900">Notifications</h3>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-sm font-medium text-navy-700 hover:text-navy-900"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markNotificationRead(notification.id)}
                        className={`w-full text-left p-4 border-b border-slate-100 last:border-0 hover:bg-navy-50/60 cursor-pointer
                        ${notification.isRead ? "bg-white" : "bg-ignite-50/50"}`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-navy-900">{notification.title}</h4>
                          <span className="text-xs text-slate-500">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{notification.description}</p>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-slate-100 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-sm font-medium text-navy-700 hover:text-navy-900"
                  >
                    View notification history
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={userMenuRef} data-tour="account-menu">
            <button
              className="relative p-1 rounded-full hover:bg-navy-50 overflow-hidden transition-colors"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="Account menu"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-navy-700">
                  <UserCircle className="h-6 w-6" />
                </span>
              )}
            </button>

            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-navy-50/50">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-navy-100">
                        {user?.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-full w-full p-2 text-navy-700" />
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                        aria-label="Change profile photo"
                      >
                        <Camera className={`h-4 w-4 text-navy-700 ${isUploadingPhoto ? "animate-pulse" : ""}`} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900 truncate">{user?.fullName ?? "Guest"}</p>
                      <p className="text-sm text-slate-500 truncate">{user?.email ?? ""}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-slate-700 hover:bg-navy-50 hover:text-navy-900"
                  >
                    <UserCircle className="h-5 w-5 mr-3" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-slate-700 hover:bg-navy-50 hover:text-navy-900"
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </Link>
                  {tour && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        tour.restartTour();
                      }}
                      className="w-full flex items-center px-4 py-2 text-slate-700 hover:bg-navy-50 hover:text-navy-900"
                    >
                      <Compass className="h-5 w-5 mr-3" />
                      Take dashboard tour again
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-slate-700 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alert Messages */}
        {alert.show && (
          <div className="fixed bottom-4 right-4 z-[80]">
            <Alert className={alert.type === "error" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
              <AlertDescription>
                {alert.message}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </header>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        data-tour="sidebar"
        className={`fixed top-16 h-[calc(100vh-4rem)] bg-white w-72 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-500 shadow-xl md:shadow-none border-r border-slate-100 overflow-y-auto z-[50]`}
      >
        <nav className="h-full py-8">
          <div className="space-y-1 px-2 pt-5">
            {navigationItems.map((item, index) => (
              <Link
                key={item.id}
                to={item.path}
                data-tour={item.tourId}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg group transition-all duration-300 relative
                  ${
                    activeItem === item.path
                      ? "bg-navy-50 text-navy-800"
                      : "text-slate-600 hover:bg-slate-50 hover:-translate-y-0.5"
                  }`}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                style={{
                  animationDelay: getAnimationDelay(index),
                }}
              >
                <CustomNavigationIcons
                  name={item.icon}
                  className={`w-5 h-5 transition-all duration-300 ${
                    activeItem === item.path
                      ? "text-navy-700 transform scale-110"
                      : "text-slate-400 group-hover:text-navy-700 group-hover:scale-110"
                  }`}
                />
                <span className="text-sm font-medium">{item.label}</span>
                {item.id === "/messages" && unreadMessageCount > 0 ? (
                  <span className="absolute right-4 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                  </span>
                ) : (
                  item.badge && (
                    <span
                      className={`absolute right-4 px-2 py-0.5 rounded-full text-xs font-medium
                      ${
                        activeItem === item.path
                          ? "bg-navy-200 text-navy-800"
                          : "bg-slate-100 text-slate-600 group-hover:bg-navy-100 group-hover:text-navy-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )
                )}
                <div
                  className={`absolute left-0 w-1 h-8 rounded-r-full bg-ignite-500 transform transition-all duration-300
                  ${
                    activeItem === item.path
                      ? "scale-y-100"
                      : "scale-y-0 group-hover:scale-y-50"
                  }`}
                />
              </Link>
            ))}
          </div>

          <div className="px-4 mt-24">
            <div
              className="p-4 bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl"
              data-tour="help-support"
            >
              <h4 className="text-sm font-semibold text-white mb-1">
                Need Help?
              </h4>
              <p className="text-xs text-navy-200 mb-3">
                Contact our support team for assistance
              </p>
              <Link
                to="/appointments"
                className="block text-center w-full px-4 py-2 bg-ignite-500 hover:bg-ignite-600 text-white rounded-lg text-sm font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-ignite-400 focus:ring-offset-2 focus:ring-offset-navy-900"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      {/* Overlay — mobile only, closes the sidebar on tap-away */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 top-16 bg-navy-950/30 backdrop-blur-sm z-[45] md:hidden transition-opacity duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default PremiumNavigation;
