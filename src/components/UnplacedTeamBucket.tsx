export function UnplacedTeamBucket() {
    return (
        <div className='unplaced-team-bucket-container h-full'>
            <div className='unplaced-team-bucket-content h-full flex flex-col'>
                <h1 className='unplaced-team-bucket-header'>UNPLACED TEAM BUCKET</h1>
                <div className='flex-1 min-h-0'>
                    <p>...no teams in the bucket...</p>
                </div>
            </div>
        </div>
    );
}