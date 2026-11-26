import api from "@/utils/api";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Pin,
  PlayCircle,
  X,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const parseSalaryLPA = (salaryStr: string): number => {
  if (!salaryStr) return 0;
  const clean = String(salaryStr).replace(/,/g, "");
  const match = clean.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

const index = () => {
  const [filteredJobs, setfilteredJobs] = useState<any[]>([]);
  const [isFiltervisible, setisFiltervisible] = useState(false);
  const [filter, setfilters] = useState({
    category: "",
    location: "",
    workFromHome: false,
    partTime: false,
    salary: 0,
    experience: "",
  });
  const [jobData, setjob] = useState<any[]>([]);

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await api.get("/job");
        setjob(res.data);
        setfilteredJobs(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);

  useEffect(() => {
    const query = filter.category.toLowerCase().trim();
    const locQuery = filter.location.toLowerCase().trim();
    const expQuery = filter.experience.toLowerCase().trim();

    const filtered = jobData.filter((job: any) => {
      // 1. Search across title, category, company (fixes typing 'f' matching 'Frontend')
      const matchesSearch =
        !query ||
        (job.title && job.title.toLowerCase().includes(query)) ||
        (job.category && job.category.toLowerCase().includes(query)) ||
        (job.company && job.company.toLowerCase().includes(query));

      // 2. Location
      const matchesLocation =
        !locQuery ||
        (job.location && job.location.toLowerCase().includes(locQuery));

      // 3. Experience
      const matchesExperience =
        !expQuery ||
        (job.Experience && job.Experience.toLowerCase().includes(expQuery));

      // 4. Work from home
      const matchesWFH =
        !filter.workFromHome ||
        (job.location &&
          (job.location.toLowerCase().includes("work from home") ||
            job.location.toLowerCase().includes("remote") ||
            job.location.toLowerCase().includes("hybrid"))) ||
        (job.additionalInfo &&
          job.additionalInfo.toLowerCase().includes("remote"));

      // 5. Part-time
      const matchesPartTime =
        !filter.partTime ||
        (job.additionalInfo &&
          job.additionalInfo.toLowerCase().includes("part")) ||
        (job.title && job.title.toLowerCase().includes("part"));

      // 6. Annual Salary (filter.salary in LPA: 0 to 50)
      const minSalaryLPA = Number(filter.salary || 0);
      const actualSalary = parseSalaryLPA(job.Salary);
      const matchesSalary = minSalaryLPA === 0 || actualSalary >= minSalaryLPA;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesExperience &&
        matchesWFH &&
        matchesPartTime &&
        matchesSalary
      );
    });

    // Prioritize title prefix matches
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

    setfilteredJobs(filtered);
  }, [filter, jobData]);

  const handlefilterchange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setfilters((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "salary"
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
      salary: 0,
      experience: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
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
              {/* Profile / Title / Category Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Profile / Role / Category
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="category"
                    value={filter.category}
                    onChange={handlefilterchange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                    placeholder="e.g. Frontend, Engineer, Security"
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
                  placeholder="e.g. Bangalore, Remote, Hyderabad"
                />
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Experience
                </label>
                <input
                  type="text"
                  name="experience"
                  value={filter.experience}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                  placeholder="e.g. 0-2 Years, Fresher"
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

              {/* Salary Range */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Annual Salary (₹ LPA)
                  </label>
                  <span className="text-xs font-bold text-blue-600">
                    {filter.salary === 0
                      ? "All"
                      : `≥ ₹${filter.salary} LPA`}
                  </span>
                </div>
                <input
                  type="range"
                  name="salary"
                  min="0"
                  max="50"
                  step="2"
                  value={filter.salary}
                  onChange={handlefilterchange}
                  className="w-full cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>₹0L</span>
                  <span>₹25L</span>
                  <span>₹50L+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Listings */}
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
                {filteredJobs.length} Jobs found
              </p>
              {(filter.category ||
                filter.location ||
                filter.experience ||
                filter.workFromHome ||
                filter.partTime ||
                filter.salary > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center shadow-xs">
                  <p className="text-gray-500 text-sm font-medium">
                    No jobs match your current filter criteria.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredJobs.map((job: any) => (
                  <div
                    key={job._id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-blue-600">
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="font-semibold text-xs">
                          Actively Hiring
                        </span>
                      </div>
                      <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                        {job.category || "Full-Time"}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {job.title}
                    </h2>
                    <p className="text-sm font-medium text-gray-600 mb-4">
                      {job.company}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <PlayCircle className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[11px] text-gray-400">
                            Start Date
                          </p>
                          <p className="font-semibold text-gray-800">
                            {job.startDate || "Immediately"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Pin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[11px] text-gray-400">Location</p>
                          <p className="font-semibold text-gray-800">
                            {job.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-[11px] text-gray-400">CTC</p>
                          <p className="font-semibold text-emerald-700">
                            {job.Salary || "Competitive"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded">
                          Job
                        </span>
                        <span className="text-gray-500 text-xs flex items-center">
                          <Briefcase className="w-3.5 h-3.5 mr-1" />
                          Exp: {job.Experience || "0-2 Years"}
                        </span>
                      </div>

                      <Link
                        href={`/detailjob/${job._id}`}
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
