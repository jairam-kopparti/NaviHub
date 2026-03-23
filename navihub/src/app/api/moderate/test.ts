import { moderateContent } from "./moderation.js";

const title = "NYC Eats and Food";
const description = "This is a wonderful food truck sponsored by the very residents of NYC. It goes around street to street, selling food of all types of cuisines.";

console.log("TITLE:", moderateContent(title));
console.log("DESC:", moderateContent(description));
