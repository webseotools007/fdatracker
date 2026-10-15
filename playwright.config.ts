import { defineConfig } from "@playwright/test";
export default defineConfig({
 testDir:"./tests/browser",workers:1,timeout:45000,reporter:"list",
 use:{baseURL:process.env.TEST_URL||"http://127.0.0.1:3038",channel:"msedge",viewport:{width:1440,height:1000},screenshot:"only-on-failure"},
 webServer:{command:"npm run dev",url:"http://127.0.0.1:3038",reuseExistingServer:false,timeout:120000,env:{PORT:"3038",NEXT_DIST_DIR:".next-browser",TRACKER_DB:".data/browser-"+Date.now()+".sqlite"}}
});
