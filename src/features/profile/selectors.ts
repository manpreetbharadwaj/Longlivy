import { RootState } from '@/store/store';

export const selectUserProfile = (state: RootState) => state.profile.profile;
