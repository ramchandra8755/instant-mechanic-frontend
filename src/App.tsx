import { useEffect, useState } from "react";
import { io } from "socket.io-client";


const API_URL = "https://instant-mechanic-backend-wdbx.onrender.com";
const socket = io(API_URL, {
  autoConnect: false,
 });
import {
  CalendarDays,
  Clock,
  Wrench,
  CheckCircle,
  Users,
  UserCog,
  Car,
  Plus,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

function App() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  

  const [bookingForm, setBookingForm] = useState({
  customerName: "",
  phone: "",
  email: "",
  vehicleNumber: "",
  vehicleModel: "",
  serviceType: "",
  estimatedCost: "",
 });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";

       case "Assigned":
        return "bg-purple-100 text-purple-700 border border-purple-200";  

      case "In Progress":
        return "bg-blue-100 text-blue-700 border border-blue-200";

      case "Completed":
        return "bg-green-100 text-green-700 border border-green-200";

      case "Cancelled":
        return "bg-red-100 text-red-700 border border-red-200";

      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await fetch(
       `${API_URL}/api/dashboard/stats`
      );

      const bookingsResponse = await fetch(
        `${API_URL}/api/bookings`
      );

      const mechanicsResponse = await fetch(
        `${API_URL}/api/mechanics`
       );

      if (!statsResponse.ok || !bookingsResponse.ok || !mechanicsResponse.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const statsData = await statsResponse.json();
      const bookingsData = await bookingsResponse.json();
      const mechanicsData = await mechanicsResponse.json();

      console.log("Dashboard Stats:", statsData);

      setStats(statsData);
      setBookings(bookingsData);
      setMechanics(mechanicsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
   };

   const filteredBookings = bookings.filter((booking) => {
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    booking.customer?.name?.toLowerCase().includes(search) ||
    booking.vehicleModel?.toLowerCase().includes(search) ||
    booking.vehicleNumber?.toLowerCase().includes(search) ||
    booking.serviceType?.toLowerCase().includes(search);

  const matchesStatus =
    statusFilter === "All" || booking.status === statusFilter;

  return matchesSearch && matchesStatus;
 });

 const bookingsOverTime = bookings.reduce((acc, booking) => {
  if (!booking.bookingDate) return acc;

  const date = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

  const existing = acc.find((item) => item.date === date);

  if (existing) {
    existing.bookings += 1;
  } else {
    acc.push({
      date,
      bookings: 1,
    });
  }

  return acc;
}, []);

const revenueOverTime = bookings.reduce((acc, booking) => {
  if (!booking.bookingDate) return acc;

  const date = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

  const existing = acc.find((item) => item.date === date);

  if (existing) {
    existing.revenue += booking.estimatedCost || 0;
  } else {
    acc.push({
      date,
      revenue: booking.estimatedCost || 0,
    });
  }

  return acc;
}, []);

 const bookingStatusData = [
  {
    name: "Pending",
    value: bookings.filter((booking) => booking.status === "Pending").length,
  },
  {
    name: "Assigned",
    value: bookings.filter((booking) => booking.status === "Assigned").length,
  },
  {
    name: "In Progress",
    value: bookings.filter((booking) => booking.status === "In Progress").length,
  },
  {
    name: "Completed",
    value: bookings.filter((booking) => booking.status === "Completed").length,
  },
  {
    name: "Cancelled",
    value: bookings.filter((booking) => booking.status === "Cancelled").length,
  },
 ];

 const serviceBreakdownData = [
  ...new Set(bookings.map((booking) => booking.serviceType)),
 ].map((service) => ({
  name: service,
  value: bookings.filter(
    (booking) => booking.serviceType === service
  ).length,
 }));


  const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await fetch(
      `${API_URL}/api/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update booking status");
    }

    const data = await response.json();

    console.log("Booking status updated successfully:", data);

    setBookings((prevBookings) =>
      prevBookings.map((booking) =>
        booking._id === bookingId
          ? data.booking
          : booking
      )
    );
  } catch (error) {
    console.error("Status update error:", error);
  }
 };

  const assignMechanic = async (bookingId, mechanicId) => {
  if (!mechanicId) return;

  try {
    const response = await fetch(
      `${API_URL}/api/bookings/${bookingId}/assign`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mechanicId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to assign mechanic");
    }

    const data = await response.json();

    console.log("Mechanic assigned successfully:", data);

  
    const bookingsResponse = await fetch(
      `${API_URL}/api/bookings`
    );

    const bookingsData = await bookingsResponse.json();

    setBookings(bookingsData);
  } catch (error) {
    console.error("Error assigning mechanic:", error);
  }
 };

 const createBooking = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    const response = await fetch(
      `${API_URL}/api/bookings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bookingForm,
          estimatedCost: Number(bookingForm.estimatedCost),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create booking");
    }

    const data = await response.json();

    console.log("Booking created successfully:", data);

    setShowBookingModal(false);

    setBookingForm({
      customerName: "",
      phone: "",
      email: "",
      vehicleNumber: "",
      vehicleModel: "",
      serviceType: "",
      estimatedCost: "",
    });

    
    setBookings((prev) => [data.booking, ...prev]);

  } catch (error) {
    console.error("Booking creation error:", error);
    alert("Failed to create booking");
  }
 };

 useEffect(() => {
  socket.connect();

  fetchDashboardData();

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  
  socket.on("bookingCreated", (newBooking) => {
    console.log("Real-time booking created:", newBooking);

    fetchDashboardData();
  });

  
  socket.on("bookingUpdated", (updatedBooking) => {
    console.log("Real-time booking updated:", updatedBooking);

    fetchDashboardData();
  });

  
  socket.on("bookingStatusUpdated", (updatedBooking) => {
    console.log("Real-time booking status update:", updatedBooking);

    fetchDashboardData();
  });

  return () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("bookingCreated");
    socket.off("bookingUpdated");
    socket.off("bookingStatusUpdated");

    socket.disconnect();
  };
}, []);

 const dashboardCards = [
  {
    title: "Total Bookings",
    value: stats?.totalBookings ?? 0,
    icon: CalendarDays,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Today's Bookings",
    value: stats?.todayBookings ?? 0,
    icon: Clock,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Completed Bookings",
    value: stats?.completedBookings ?? 0,
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Pending Bookings",
    value: stats?.pendingBookings ?? 0,
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    title: "Cancelled Bookings",
    value: stats?.cancelledBookings ?? 0,
    icon: Wrench,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    title: "Total Revenue",
    value: `₹${stats?.totalRevenue ?? 0}`,
    icon: CalendarDays,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Active Mechanics",
    value: stats?.availableMechanics ?? 0,
    icon: UserCog,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "New Customers",
    value: stats?.newCustomers ?? 0,
    icon: Users,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
 ];
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>

          <p className="mt-4 text-gray-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-500">{error}</h1>
        </div>
      </div>
    );
  }

  const sortedBookings = [...filteredBookings].sort((a, b) => {
  const dateA = new Date(a.bookingDate).getTime();
  const dateB = new Date(b.bookingDate).getTime();

  return sortOrder === "newest"
    ? dateB - dateA
    : dateA - dateB;
 });

 const totalPages = Math.ceil(
  sortedBookings.length / itemsPerPage
 );

 const startIndex = (currentPage - 1) * itemsPerPage;

 const paginatedBookings = sortedBookings.slice(
  startIndex,
  startIndex + itemsPerPage
 );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
          <div>
            <p className="text-blue-600 font-semibold text-sm mb-2">
              DASHBOARD OVERVIEW
            </p>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Vehicle Service Dashboard
            </h1>

            <p className="text-gray-500 mt-2">
              Monitor your vehicle service bookings and operations
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBookingModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-200"
            >
              <Plus size={20} />
              New Booking
            </button>

            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Car size={28} className="text-white" />
            </div>
          </div>
        </div>

        

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-gray-500 text-sm font-medium">
                      {card.title}
                    </p>

                    <h2 className="text-3xl font-bold text-gray-900 mt-3">
                      {card.value}
                    </h2>
                  </div>

                  <div
                    className={`${card.bg} ${card.color} shrink-0 w-14 h-14 rounded-xl flex items-center justify-center`}
                  >
                    <Icon size={27} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Bookings Over Time
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Booking activity based on booking date
            </p>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Revenue Over Time
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Revenue generated from vehicle service bookings
            </p>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Booking Status Distribution
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Distribution of bookings by current status
            </p>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Service Category Breakdown
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Number of bookings by service type
            </p>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="#7c3aed"
                  name="Bookings"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Mechanics
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Current mechanic availability and service activity
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Mechanic
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Jobs Completed
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Current / Last Booking
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {mechanics.map((mechanic) => {
                      const mechanicBookings = bookings
                        .filter(
                          (booking) =>
                            booking.mechanic?._id === mechanic._id
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.bookingDate).getTime() -
                            new Date(a.bookingDate).getTime()
                        );

                      const activeBooking = mechanicBookings.find(
                        (booking) =>
                          booking.status === "Assigned" ||
                          booking.status === "In Progress"
                      );

                      const latestBooking =
                        activeBooking || mechanicBookings[0];

                      return (
                        <tr
                          key={mechanic._id}
                          className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition"
                        >
                          <td className="px-6 py-5">
                            <div className="font-semibold text-gray-800">
                              {mechanic.name}
                            </div>

                            <div className="text-sm text-gray-500">
                              {mechanic.specialization}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                                mechanic.status === "Available"
                                  ? "bg-green-100 text-green-700"
                                  : mechanic.status === "Busy"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {mechanic.status}
                            </span>
                          </td>

                          <td className="px-6 py-5 font-semibold text-gray-800">
                            {mechanic.jobsCompleted}
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-600">
                            {latestBooking ? (
                              <div>
                                <div className="font-medium text-gray-800">
                                  #{latestBooking._id
                                    .slice(-6)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  {latestBooking.vehicleModel} •{" "}
                                  {latestBooking.serviceType}
                                </div>

                                <div className="text-xs text-gray-400 mt-1">
                                  {latestBooking.status}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                No booking
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

        {/* Recent Bookings */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Recent Bookings
              </h2>

              <div className="flex flex-col md:flex-row gap-4 mt-6 mb-6">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search customer, vehicle, service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-700 outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-56"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.min(filteredBookings.length, 10)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {bookings.length}
                  </span>{" "}
                  bookings
                </p>
              </div>

              <p className="text-gray-500 text-sm mt-1">
                Latest vehicle service requests
              </p>
            </div>

            <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold">
              {bookings.length} Total
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Booking ID
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Vehicle
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Service
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Mechanic
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Estimated Cost
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Date / Time
                    </th>
                  </tr>
                </thead>

               <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-5 text-sm font-medium text-gray-700">
                        #{booking._id.slice(-6).toUpperCase()}
                      </td>
                      {/* Customer */}
                      <td className="px-6 py-5 font-medium text-gray-800">
                        {booking.customer?.name || "Unknown"}
                      </td>

                      {/* Vehicle */}
                      <td className="px-6 py-5 text-gray-600">
                        {booking.vehicleModel}
                      </td>

                      {/* Service */}
                      <td className="px-6 py-5 text-gray-600">
                        {booking.serviceType}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <select
                          value={booking.status}
                          onChange={(e) =>
                            updateBookingStatus(booking._id, e.target.value)
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-semibold outline-none cursor-pointer ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Mechanic */}
                      <td className="px-6 py-5">
                        {booking.mechanic ? (
                          <span className="text-gray-800 font-medium">
                            {booking.mechanic.name}
                          </span>
                        ) : (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                assignMechanic(booking._id, e.target.value);
                              }
                            }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="" disabled>
                              Assign Mechanic
                            </option>

                            {mechanics
                              .filter(
                                (mechanic) => mechanic.status === "Available"
                              )
                              .map((mechanic) => (
                                <option
                                  key={mechanic._id}
                                  value={mechanic._id}
                                >
                                  {mechanic.name} - {mechanic.specialization}
                                </option>
                              ))}
                          </select>
                        )}
                      </td>

                      {/* Estimated Cost */}
                      <td className="px-6 py-5 font-semibold text-gray-800">
                        ₹{booking.estimatedCost}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {new Date(booking.bookingDate).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing{" "}
                {sortedBookings.length === 0 ? 0 : startIndex + 1}
                {" - "}
                {Math.min(
                  startIndex + itemsPerPage,
                  sortedBookings.length
                )}{" "}
                of {sortedBookings.length} bookings
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
        </div>

      </div>

      {showBookingModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl">

      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Create New Booking
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Add a new vehicle service booking
          </p>
        </div>

        <button
          onClick={() => setShowBookingModal(false)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X size={22} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={createBooking} className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Customer Name
            </label>

            <input
              required
              type="text"
              value={bookingForm.customerName}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  customerName: e.target.value,
                })
              }
              className="w-full mt-2 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Phone Number
            </label>

            <input
              required
              type="text"
              value={bookingForm.phone}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  phone: e.target.value,
                })
              }
              className="w-full mt-2 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Email
            </label>

            <input
              required
              type="email"
              value={bookingForm.email}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  email: e.target.value,
                })
              }
              className="w-full mt-2 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Vehicle Number
            </label>

            <input
              required
              type="text"
              value={bookingForm.vehicleNumber}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  vehicleNumber: e.target.value,
                })
              }
              className="w-full mt-2 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="DL 01 AB 1234"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Vehicle Model
            </label>

            <input
              required
              type="text"
              value={bookingForm.vehicleModel}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  vehicleModel: e.target.value,
                })
              }
              className="w-full mt-2 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Honda City"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Service Type
            </label>

            <select
              required
              value={bookingForm.serviceType}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  serviceType: e.target.value,
                })
              }
              className="w-full mt-2 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select service</option>
              <option value="General Service">General Service</option>
              <option value="Engine Repair">Engine Repair</option>
              <option value="AC Service">AC Service</option>
              <option value="Oil Change">Oil Change</option>
              <option value="Brake Service">Brake Service</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Estimated Cost
            </label>

            <input
              required
              type="number"
              value={bookingForm.estimatedCost}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  estimatedCost: e.target.value,
                })
              }
              className="w-full mt-2 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter estimated cost"
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-8">

          <button
            type="button"
            onClick={() => setShowBookingModal(false)}
            className="px-5 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Create Booking
          </button>
        </div>
      </form>
    </div>
  </div>
 )}
    </div>
  );
}

export default App;