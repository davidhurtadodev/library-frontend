import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import loginService from '../services/login.service';
import bookService from '../services/book.service';
import userService from '../services/user.service';

interface userStateInterface {
  user: {
    username: string;
    id: string;
    token: string;
  } | null;
  status: string;
  notification: string;
  error: boolean;
}

const initialState: userStateInterface = {
  user: null,
  status: 'idle',
  error: false,
  notification: '',
};

export const logUserAsync = createAsyncThunk(
  'user/logUserAsyncStatus',
  async (credentials: any) => {
    const user = await loginService.login(credentials);
    return user;
  }
);

export const createUserAsync = createAsyncThunk(
  'user/createUserThunk',
  async (userData: { username: string; password: string }) => {
    const newUser: {
      username: string;
      passwordHash: string;
      books: {}[];
    } = await userService.create(userData);
    return newUser;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      window.localStorage.setItem(
        'loggedLibraryUser',
        JSON.stringify(action.payload)
      );
      bookService.setToken(action.payload.token);

      state.user = action.payload;
    },
    unsetUser(state, action) {
      window.localStorage.clear();
      state.user = null;
    },
    setUserIdleStatus(state, action) {
      state.error = false;
      state.notification = '';
      state.status = 'idle';
    },
  },
  extraReducers(builder) {
    builder
      .addCase(createUserAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notification = `user ${action.payload.username} created`;
      })
      .addCase(createUserAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.notification = action.error.message!;
        state.error = true;
      })
      .addCase(createUserAsync.pending, (state, action) => {
        state.status = 'loading';
      })
      .addCase(logUserAsync.fulfilled, (state, action) => {
        window.localStorage.setItem(
          'loggedLibraryUser',
          JSON.stringify(action.payload)
        );
        bookService.setToken(action.payload.token);
        state.status = 'succeeded';
        state.user = action.payload;
        state.notification = `${action.payload.username} logged in`;
      })

      .addCase(logUserAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.notification = 'Invalid username or password';
        state.error = true;
      })
      .addCase(logUserAsync.pending, (state, action) => {
        state.status = 'loading';
      });
  },
});

export const { setUser, unsetUser, setUserIdleStatus } = userSlice.actions;

export default userSlice.reducer;
