import api from "@/utils/api";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Pin,
  PlayCircle,
  Pointer,
  X,
  Search,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const parseStipend = (stipendStr: string): number => {
  if (!stipendStr) return 0;
  const clean = String(stipendStr).replace(/,/g, "");
  const match = clean.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

const index = () => {
  const [filteredInternships, setfilteredInternships] = useState<any[]>([]);
  const [isFiltervisible, setisFiltervisible] = useState(false);
  const [filter, setfilters] = useState({
    category: "",
    location: "",
    workFromHome: false,
    partTime: false,
    stipend: 0,
  });
  const [internshipData, setinternship] = useState<any[]>([]);

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await api.get("/internship");
        setinternship(res.data);
        setfilteredInternships(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);

  useEffect(() => {
    const query = filter.category.toLowerCase().trim();
    const locQuery = filter.location.toLowerCase().trim();

    const filtered = internshipData.filter((internship: any) => {
      // 1. Search across title, category, company (fixes: typing 'f' matches 'Frontend Developer Intern')
      const matchesSearch =
        !query ||
        (internship.title && internship.title.toLowerCase().includes(query)) ||
        (internship.category && internship.category.toLowerCase().includes(query)) ||
        (internship.company && internship.company.toLowerCase().includes(query));

      // 2. Location filter
      const matchesLocation =
        !locQuery ||
        (internship.location && internship.location.toLowerCase().includes(locQuery));

      // 3. Work from home checkbox
      const matchesWFH =
        !filter.workFromHome ||
        (internship.location &&
          (internship.location.toLowerCase().includes("work from home") ||
            internship.location.toLowerCase().includes("remote") ||
            internship.location.toLowerCase().includes("hybrid"))) ||
        (internship.additionalInfo &&
          internship.additionalInfo.toLowerCase().includes("remote"));

      // 4. Part-time checkbox
      const matchesPartTime =
        !filter.partTime ||
        (internship.duration &&
          internship.duration.toLowerCase().includes("part")) ||
        (internship.perks &&
          internship.perks.some(
            (p: string) =>
              p.toLowerCase().includes("part") ||
              p.toLowerCase().includes("flexible")
          )) ||
        (internship.additionalInfo &&
          internship.additionalInfo.toLowerCase().includes("part")) ||
        (internship.title &&
          internship.title.toLowerCase().includes("part"));

      // 5. Stipend slider (stipend is in thousands: 0 to 100)
      const minAmount = Number(filter.stipend || 0) * 1000;
      const actualStipend = parseStipend(internship.stipend);
      const matchesStipend = minAmount === 0 || actualStipend >= minAmount;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesWFH &&
        matchesPartTime &&
        matchesStipend
      );
    });

    // Sort to prioritize exact title matches first
    if (query) {
      filtered.sort((a: any, b: any) => {
        const aTitleStartsWith = a.title?.toLowerCase().startsWith(query);
        const bTitleStartsWith = b.title?.toLowerCase().startsWith(query);
        if (aTitleStartsWith && !bTitleStartsWith) return -1;
        if (!aTitleStartsWith && bTitleStartsWith) return 1;

        const aTitleHas = a.title?.toLowerCase().includes(query);
        const bTitleHas = b.title?.toLowerCase().includes(query);
        if (aTitleHas && !bTitleHas) return -1;
        if (!aTitleHas && bTitleHas) return 1;

        return 0;
      });
    }

    setfilteredInternships(filtered);
  }, [filter, internshipData]);

  const handlefilterchange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setfilters((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "stipend"
          ? Number(value)
          : value,
    }));
  };

  const clearFilters = () => {
    setfilters({
      category: "",
      location: "",
      workFromHome: false,
      partTime: false,
      stipend: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filter Sidebar */}
          <div
            className={`${
              isFiltervisible ? "block" : "hidden"
            } md:block w-full md:w-64 bg-white rounded-lg shadow-sm p-6 h-fit`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Filters</span>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile / Category Search Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Profile / Title / Category
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="category"
                    value={filter.category}
                    onChange={handlefilterchange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                    placeholder="e.g. Frontend, Marketing"
                  />
                  {filter.category && (
                    <button
                      onClick={() =>
                        setfilters((prev) => ({ ...prev, category: "" }))
                      }
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filter.location}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                  placeholder="e.g. Bangalore, Remote, Mumbai"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="workFromHome"
                    checked={filter.workFromHome}
                    onChange={handlefilterchange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 select-none">
                    Work from home
                  </span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="partTime"
                    checked={filter.partTime}
                    onChange={handlefilterchange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 select-none">
                    Part-time
                  </span>
                </label>
              </div>

              {/* Stipend Range Slider */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Monthly Stipend (₹)
                  </label>
                  <span className="text-xs font-bold text-blue-600">
                    {filter.stipend === 0
                      ? "All"
                      : `≥ ₹${filter.stipend}K`}
                  </span>
                </div>
                <input
                  type="range"
                  name="stipend"
                  min="0"
                  max="100"
                  step="5"
                  value={filter.stipend}
                  onChange={handlefilterchange}
                  className="w-full cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>₹0</span>
                  <span>₹50K</span>
                  <span>₹100K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Listings Area */}
          <div className="flex-1">
            <div className="md:hidden mb-4">
              <button
                onClick={() => setisFiltervisible(!isFiltervisible)}
                className="w-full flex items-center justify-center space-x-2 bg-white p-3 rounded-lg shadow-sm text-blue-600 font-semibold"
              >
                <Filter className="h-5 w-5" />
                <span>
                  {isFiltervisible ? "Hide Filters" : "Show Filters"}
                </span>
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex items-center justify-between">
              <p className="font-semibold text-gray-800 text-sm">
                {filteredInternships.length} Internships found
              </p>
              {(filter.category ||
                filter.location ||
                filter.workFromHome ||
                filter.partTime ||
                filter.stipend > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="space-y-4">
              {filteredInternships.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center shadow-xs">
                  <p className="text-gray-500 text-sm font-medium">
                    No internships match your current filter criteria.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredInternships.map((internship: any) => (
                  <div
                    key={internship._id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-blue-600">
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="font-semibold text-xs">
                          Actively Hiring
                        </span>
                      </div>
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {internship.category || "General"}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {internship.title}
                    </h2>
                    <p className="text-sm font-medium text-gray-600 mb-4">
                      {internship.company}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <PlayCircle className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[11px] text-gray-400">
                            Start Date
                          </p>
                          <p className="font-semibold text-gray-800">
                            {internship.startDate || "Immediately"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Pin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[11px] text-gray-400">Location</p>
                          <p className="font-semibold text-gray-800">
                            {internship.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-[11px] text-gray-400">Stipend</p>
                          <p className="font-semibold text-emerald-700">
                            {internship.stipend}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded">
                          Internship
                        </span>
                        <span className="text-gray-500 text-xs flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {internship.duration || "3-6 Months"}
                        </span>
                      </div>

                      <Link
                        href={`/detailiternship/${internship._id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center group"
                      >
                        View Details
                        <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
