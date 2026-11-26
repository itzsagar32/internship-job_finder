import { createSlice } from "@reduxjs/toolkit";

const getInitialUser = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("internshala_user");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return null;
};

const getInitialToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("internshala_token") || null;
  }
  return null;
};

export const userslice = createSlice({
  name: "user",
  initialState: {
    user: getInitialUser(),
    token: getInitialToken(),
    isAuthenticated: !!getInitialToken(),
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("internshala_user", JSON.stringify(action.payload));
      }
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("internshala_token", action.payload);
        } else {
          localStorage.removeItem("internshala_token");
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("internshala_token");
        localStorage.removeItem("internshala_user");
      }
    },
    updateProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== "undefined") {
          localStorage.setItem("internshala_user", JSON.stringify(state.user));
        }
      }
    },
  },
});

export const { login, logout, setToken, updateProfile } = userslice.actions;
export const selectuser = (state) => state.user.user;
export const selecttoken = (state) => state.user.token;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export default userslice.reducer;
