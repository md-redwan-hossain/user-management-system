import { RequestHandler } from "express";
import { ValidationChain, matchedData } from "express-validator";
import { validationReport } from "../utils/expressValidator.util.macro.js";
import { limitRule, pageRule, sortRule } from "../validators/queryParam.validator.macro.js";

export const separateSortLimitPageFromReq: RequestHandler = (req, res, next): void => {
  const data = matchedData(req);
  if (data.limit) {
    res.locals.dataPerPage = data.limit;
    delete req.query.limit;
  }
  if (data.sort) {
    let prismaSortObj;
    const prismaSortArr: string[] = data.sort.split(" ");

    prismaSortArr.forEach((elem) => {
      if (elem.startsWith("-")) {
        // eslint-disable-next-line
        elem = elem.slice(1);
        prismaSortObj = { ...prismaSortObj, [`${elem}`]: "desc" };
      } else {
        prismaSortObj = { ...prismaSortObj, [`${elem}`]: "asc" };
      }
    });

    res.locals.sortingData = prismaSortObj;
    delete req.query.sort;
  }
  if (data.page) {
    res.locals.PageNumber = data.page;
    delete req.query.page;
  }
  next();
};

export const calculatePagination: RequestHandler = (req, res, next): void => {
  if (res.locals.dataPerPage && res.locals.PageNumber) {
    res.locals.skipValue = (res.locals.PageNumber - 1) * res.locals.dataPerPage;
  }
  next();
};

export const sanitizeAndSeparateSortAndLimit: (ValidationChain[] | RequestHandler)[] = [
  sortRule(),
  limitRule(),
  pageRule(),
  validationReport,
  separateSortLimitPageFromReq,
  calculatePagination
];
