export async function getServerSideProps(ctx) {
  ctx.res.writeHead(302, { location: "/dashboard" });
  ctx.res.end();
}

function Page({ data }) {}
export default Page;
