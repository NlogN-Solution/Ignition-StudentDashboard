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
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

import navigationItems from "../../data/navigation.json";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import { formatDeadline, formatRelativeTime } from "../../lib/simulate";

const PremiumNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-16 bg-white z-[60] flex items-center justify-between px-4 transition-all duration-500
        ${isScrolled ? "shadow-lg border-b border-gray-100" : "shadow-sm"}`}
      >
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden relative z-[70]"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X size={20} className="transition-all duration-300" />
            ) : (
              <Menu size={20} className="transition-all duration-300" />
            )}
          </button>
          <Link to="/" className="text-green-600 font-bold text-xl relative z-[70]">
            Ignition
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Priority Tasks */}
          <div className="relative" ref={priorityTasksRef}>
            <button
              className="relative p-2 rounded-full hover:bg-gray-100"
              onClick={() => setShowPriorityTasks(!showPriorityTasks)}
              aria-label="Priority tasks"
            >
              <ListChecks className="h-6 w-6" />
              {priorityTasks.length > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {priorityTasks.length}
                </span>
              )}
            </button>

            {showPriorityTasks && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold">Priority Tasks</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {priorityTasks.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nothing outstanding
                    </div>
                  ) : (
                    priorityTasks.slice(0, 6).map((task) => (
                      <Link
                        key={task.id}
                        to="/tasks"
                        onClick={() => setShowPriorityTasks(false)}
                        className="block w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatDeadline(task.dueDate)}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 text-center">
                  <Link
                    to="/tasks"
                    onClick={() => setShowPriorityTasks(false)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View all tasks
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              className="relative p-2 rounded-full hover:bg-gray-100"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-6 w-6" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markNotificationRead(notification.id)}
                        className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer
                        ${notification.isRead ? "bg-white" : "bg-blue-50"}`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{notification.title}</h4>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View notification history
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="relative p-2 rounded-full hover:bg-gray-100 overflow-hidden"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-6 w-6" />
              )}
            </button>

            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                        {user?.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-full w-full p-2" />
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Camera className={`h-4 w-4 ${isUploadingPhoto ? "animate-pulse" : ""}`} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{user?.fullName ?? "Guest"}</p>
                      <p className="text-sm text-gray-600">{user?.email ?? ""}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <UserCircle className="h-5 w-5 mr-3" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
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
          <div className="fixed bottom-4 right-4">
            <Alert className={alert.type === "error" ? "bg-red-50" : "bg-green-50"}>
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
        className={`fixed top-16 h-[calc(100vh-4rem)] bg-white w-72 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-500 shadow-xl border-r border-gray-100 overflow-y-auto z-[50]`}
      >
        <nav className="h-full py-8">
          <div className="space-y-1 px-2 pt-5">
            {navigationItems.map((item, index) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 group transition-all duration-300 relative
                  ${
                    activeItem === item.path
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5"
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
                      ? "text-blue-600 transform scale-110"
                      : "text-gray-500 group-hover:text-blue-600 group-hover:scale-110"
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
                          ? "bg-blue-200 text-blue-700"
                          : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )
                )}
                <div
                  className={`absolute left-0 w-1 h-8 rounded-r-full bg-blue-500 transform transition-all duration-300
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
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">
                Need Help?
              </h4>
              <p className="text-xs text-blue-600 mb-3">
                Contact our support team for assistance
              </p>
              <Link
                to="/appointments"
                className="block text-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="mt-16 md:ml-72 relative">
        {/* Overlay - Only show on mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-800/30 backdrop-blur-sm z-[45] md:hidden transition-opacity duration-500 mt-16"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PremiumNavigation;
