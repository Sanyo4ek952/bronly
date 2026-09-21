import { createPublicDetailRoute } from "@/widgets/public-stay-detail/public-stay-detail";

const route = createPublicDetailRoute("a", "properties");
export const generateMetadata = route.generateMetadata;
export default route.Page;
