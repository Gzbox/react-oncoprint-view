import * as React from 'react';
import { Link } from 'react-router-dom';

export class StudyLink extends React.Component<
    { studyId: string; className?: string },
    {}
> {
    render() {
        return (
            <Link
                to={`/study?id=${this.props.studyId}`}
                className={this.props.className}
            >
                {this.props.children}
            </Link>
        );
    }
}
