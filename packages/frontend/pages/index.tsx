export async function getServerSideProps(ctx) {
  if (!ctx.res.headersSent) {
    if (typeof ctx.res.writeHead === "function")
      ctx.res.writeHead(302, { location: "/dashboard" });
  }
  ctx.res.end();
}

function Page() {}
export default Page;
