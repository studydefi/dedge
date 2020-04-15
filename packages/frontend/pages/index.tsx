export async function getServerSideProps(ctx) {
  ctx.res.writeHead(302, { location: "/dashboard" });
  ctx.res.end();
}

function Page() {}
export default Page;
