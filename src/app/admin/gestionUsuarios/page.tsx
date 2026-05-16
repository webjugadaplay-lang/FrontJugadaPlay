// app/admin/gestionUsuarios/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Search, Filter, Edit, Trash2, Eye, Ban,
  CheckCircle, Shield, User, Crown, ArrowLeft,
  ChevronLeft, ChevronRight, MoreVertical, X,
  Save, AlertCircle, Mail, Phone, MapPin, Calendar
} from "lucide-react";
import { translations, type Locale } from "@/messages";

interface UserData {
  id: string;
  name: string;
  nickname: string | null;
  email: string;
  role: "owner" | "player" | "admin";
  country: string;
  phoneCountry: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  createdAt: string;
  updatedAt: string;
  bars?: Array<{
    id: string;
    name: string;
    bar_name: string;
    status: string;
  }>;
}

interface EditModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<UserData>) => void;
  locale: Locale;
}

function EditUserModal({ user, isOpen, onClose, onSave, locale }: EditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const t = translations[locale];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-black border border-yellow-500/20 rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-yellow-500 font-light">{t.admin.users.editUser}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-yellow-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.admin.users.name}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-black/50 border border-yellow-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.admin.users.email}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-black/50 border border-yellow-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.admin.users.phone}</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-black/50 border border-yellow-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">{t.admin.users.role}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-black/50 border border-yellow-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500/60"
            >
              <option value="player">{t.admin.users.player}</option>
              <option value="owner">{t.admin.users.owner}</option>
              <option value="admin">{t.admin.users.admin}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg hover:border-yellow-500/50 transition-all"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-all"
          >
            {t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR";

  const savedLocale = localStorage.getItem("jugadaplay_locale");
  if (savedLocale === "pt-BR" || savedLocale === "es") {
    return savedLocale;
  }

  const browserLanguage =
    navigator.language || (navigator.languages && navigator.languages[0]) || "";

  const normalizedLanguage = browserLanguage.toLowerCase();

  if (normalizedLanguage.startsWith("es")) return "es";
  if (normalizedLanguage.startsWith("pt")) return "pt-BR";

  return "pt-BR";
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "player" | "admin">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const usersPerPage = 10;

  useEffect(() => {
    const detectedLocale = detectInitialLocale();
    setLocale(detectedLocale);
    setIsLocaleReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) return;
    localStorage.setItem("jugadaplay_locale", locale);
  }, [locale, isLocaleReady]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchUsers(token);
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
      } else {
        console.error("Error fetching users:", data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, users]);

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<UserData>) => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        const token = localStorage.getItem("token");
        if (token) await fetchUsers(token);
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } else {
        alert(data.message || "Error al actualizar usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const token = localStorage.getItem("token");
        if (token) await fetchUsers(token);
        setShowDeleteConfirm(null);
      } else {
        alert(data.message || "Error al eliminar usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    setActionLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: currentStatus === "active" ? "inactive" : "active",
        }),
      });

      const data = await response.json();

      if (data.success) {
        const token = localStorage.getItem("token");
        if (token) await fetchUsers(token);
      } else {
        alert(data.message || "Error al cambiar estado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cambiar estado");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-purple-500" />;
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      default:
        return <User className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleText = (role: string) => {
    const t = translations[locale];
    switch (role) {
      case "admin":
        return t.admin.users.admin;
      case "owner":
        return t.admin.users.owner;
      default:
        return t.admin.users.player;
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      BR: "🇧🇷",
      CO: "🇨🇴",
      MX: "🇲🇽",
    };
    return flags[country] || "🏳️";
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (loading || !isLocaleReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Cargando...</div>
      </div>
    );
  }

  const t = translations[locale];

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.admin.users.backToDashboard}
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl text-yellow-500 font-light">{t.admin.users.title}</h1>
              <p className="text-gray-500 text-sm mt-1">{t.admin.users.subtitle}</p>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={t.admin.users.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black border border-yellow-500/30 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/60 w-64"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-black border border-yellow-500/30 rounded-lg px-4 py-2 text-yellow-500 text-sm focus:outline-none focus:border-yellow-500/60"
              >
                <option value="all">{t.admin.users.allRoles}</option>
                <option value="owner">{t.admin.users.owners}</option>
                <option value="player">{t.admin.users.players}</option>
                <option value="admin">{t.admin.users.admins}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-black/30 border border-yellow-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-yellow-500/20 bg-black/50">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.users.user}</th>
                  <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.users.contact}</th>
                  <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.users.role}</th>
                  <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.users.country}</th>
                  <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.users.registered}</th>
                  <th className="px-6 py-4 text-xs text-gray-500 tracking-wider">{t.admin.users.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-500/10">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-yellow-500/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="text-white text-sm font-medium">{user.name}</span>
                        </div>
                        {user.nickname && (
                          <span className="text-gray-500 text-xs">@{user.nickname}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-gray-300 text-xs">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Phone className="w-3 h-3" />
                          <span>({user.phoneCountry}) {user.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        user.role === "admin"
                          ? "bg-purple-500/20 text-purple-400"
                          : user.role === "owner"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {getRoleIcon(user.role)}
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">
                        {getCountryFlag(user.country)} {user.country}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors"
                          title={t.admin.users.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleUserStatus(user.id, "active")}
                          className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                          title={t.admin.users.toggleStatus}
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title={t.admin.users.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {user.role === "owner" && (
                          <Link href={`/admin/bares/${user.id}`}>
                            <button
                              className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors"
                              title={t.admin.users.viewBars}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">{t.admin.users.noUsers}</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 px-6 py-4 border-t border-yellow-500/20">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-gray-400 text-sm">
                {t.admin.users.page} {currentPage} {t.admin.users.of} {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        locale={locale}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-black border border-yellow-500/20 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl text-yellow-500 font-light">{t.admin.users.confirmDelete}</h2>
            </div>
            <p className="text-gray-400 mb-6">{t.admin.users.deleteWarning}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg hover:border-yellow-500/50 transition-all"
                disabled={actionLoading}
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? t.admin.users.deleting : t.admin.users.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="text-yellow-500">{t.common.loading}</div>
        </div>
      )}
    </main>
  );
}