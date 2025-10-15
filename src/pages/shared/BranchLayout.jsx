import BranchNavigation from "./BranchNavigation"
import Footer from "./Footer"

export default function BranchLayout({ children, branchName }) {
  return (
    <div className="min-h-screen bg-white">
      <BranchNavigation branchName={branchName} />
      <main>{children}</main>
      <Footer />
    </div>
  )
}





