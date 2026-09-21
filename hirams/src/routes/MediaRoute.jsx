import { ENV } from "../config/env";

const MediaRoute = {
  resolveProfileImage: (user, previewUrl = null) => {
    if (previewUrl) return previewUrl;

    const base = ENV.API_IMAGES;

    if (user?.strProfileImage) {
      return `${base}profile/${user.strProfileImage}`;
    }

    if (user?.cSex === "M") {
      return `${base}profile/profile-male.png`;
    }

    if (user?.cSex === "F") {
      return `${base}profile/profile-female.png`;
    }

    return `${base}profile/index.png`;
  },

  resolveCompanyLogo: (company, previewUrl = null) => {
    if (previewUrl) return previewUrl;
    const base = ENV.API_IMAGES;
    if (company?.strLogo) return `${base}logo/${company.strLogo}`;
    return null;
  },
};

export default MediaRoute;