import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from './Link';

class LinkList extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		if (this.props.links.length < 1) {
			return null;
		}
		const delimiter = !this.props.delimiter ? '<br/>' : this.props.delimiter;
		return (
			<span>
				{this.props.links.map((e, i) => {
					if (i === 0) {
						return (
							<span key={i}>
								<Link link={e.link}
									target={e.target}
									text={e.text} />
							</span>
						);
					}
					return (
						<span key={i}>
							<span dangerouslySetInnerHTML={{ __html: delimiter }} />
							<Link link={e.link}
								target={e.target}
								text={e.text} />
						</span>
					);
				})}
			</span>
		);
	}
}

LinkList.propTypes = {
	links: PropTypes.arrayOf(
		PropTypes.shape({
			link: PropTypes.string.isRequired,
			target: PropTypes.string.isRequired,
			text: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	delimiter: PropTypes.string
};

export default LinkList;