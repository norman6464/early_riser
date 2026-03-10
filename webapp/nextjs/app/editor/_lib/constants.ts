const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const PRESS_RELEASE_ID = 1;
const queryKey = ['press-release', PRESS_RELEASE_ID];
const TITLE_MAX_LENGTH = 100;
const BODY_MAX_LENGTH = 500;

export { API_URL, PRESS_RELEASE_ID, queryKey, TITLE_MAX_LENGTH, BODY_MAX_LENGTH };
