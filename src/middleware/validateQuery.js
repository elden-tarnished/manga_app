import {
  validDemographicSet,
  validExplicitGenre,
  validGenreSet,
  validOrder,
  validThemeSet,
  validType,
} from "../utils/backendUtils/genreHandling.mjs";

async function validateQuery(req, res, next) {
  try {
    const {
      direction = null,
      order = "popularity",
      genre = "",
      theme = "",
      explicitGenre = "",
      type = "",
      demographic = "",
    } = req.query;
    const validGenre = await validGenreSet();
    const validTheme = await validThemeSet();
    const validDemographic = await validDemographicSet();
    let directionToUse = direction;
    if (directionToUse === null) {
      directionToUse = order === "mean" ? "desc" : "asc";
    }

    directionToUse =
      typeof directionToUse === "string" &&
      directionToUse.toUpperCase() === "DESC"
        ? directionToUse.toUpperCase()
        : "ASC";
    const orderToUse =
      typeof order === "string" && validOrder.has(order) ? order : "popularity";

    const validateTags = (tags, tagSet) => {
      if (!tags) return null;
      const tagArray = Array.isArray(tags) ? tags : [tags];
      const invalidTag = tagArray.filter((tag) => !tagSet.has(tag));
      if (invalidTag.length > 0) {
        return invalidTag;
      }
      return null;
    };

    const invalidGenre = validateTags(genre, validGenre);
    if (invalidGenre) {
      return res
        .status(400)
        .json({ error: "Invalid tag ", validTag: [...validGenre] });
    }

    const invalidTheme = validateTags(theme, validTheme);
    if (invalidTheme) {
      return res
        .status(400)
        .json({ error: "Invalid tag ", validTag: [...validTheme] });
    }

    const invalidExplicit = validateTags(explicitGenre, validExplicitGenre);
    if (invalidExplicit) {
      return res
        .status(400)
        .json({ error: "Invalid tag ", validTag: [...validExplicitGenre] });
    }

    const invalidType = validateTags(type, validType);
    if (invalidType) {
      return res
        .status(400)
        .json({ error: "Invalid tag ", validTag: [...validType] });
    }

    const invalidDemographic = validateTags(demographic, validDemographic);
    if (invalidDemographic) {
      return res
        .status(400)
        .json({ error: "Invalid tag ", validTag: [...validDemographic] });
    }

    req.validated = {
      demographic,
      type,
      explicit_genre: explicitGenre,
      genre,
      theme,
      direction: directionToUse,
      order: orderToUse,
    };

    next();
  } catch (err) {
    console.error("Error at validate query middleware: ", err);
    return res
      .status(500)
      .json({ error: "Internal server error during caching tags" });
  }
}

export { validateQuery };
