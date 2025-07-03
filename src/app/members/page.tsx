import { members } from "@/lib/data"
import MembersList from "@/components/members/members-list"

export default function MembersPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-headline font-bold">Members</h1>
            <MembersList members={members} />
        </div>
    )
}
