import Utilities from './common/Utilities';

export default [{
		name: 'Adding applications having any projects',
		appliesTo: (index, application) => {
			return _hasProductionLifecycle(application);
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return false;
			}
			return subIndex.nodes.length > 0;
		}
	}, {
		name: 'Retiring applications having project (w/ impact \'Sunsets\' or decommissioning)',
		appliesTo: (index, application) => {
			return _isRetiring(application);
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return false;
			}
			return subIndex.nodes.length > 0 && _isRetiringProjectAttached(index, subIndex);
		}
	}, {
		name: 'has COBRA (only active, exactly one)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToBusinessCapability;
			if (!subIndex || subIndex.nodes.length < 1) {
				return false;
			}
			const compliantBCs = subIndex.nodes.filter((e) => {
				// access businessCapabilities
				const bc = index.byID[e.id];
				return bc && (!config.appMapId ? index.includesTag(bc, 'AppMap') : true);
			});
			return compliantBCs.length === 1;
		}
	}, {
		name: 'has COTS Package TagGroup assigned (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'COTS Package') ? true : false;
		}
	}, {
		name: 'has Software Product (only active, w/ Tag \'COTS Package\')',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active'
				&& index.includesTag(application, 'COTS Package');
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToITComponent;
			if (!subIndex || subIndex.nodes.length < 1) {
				return false;
			}
			const compliantITComp = subIndex.nodes.find((e) => {
				// access itComponents
				return index.byID[e.id];
			});
			return compliantITComp ? true : false;
		}
	}, {
		name: 'has Software Product, but no Placeholder (only active, w/ Tag \'COTS Package\')',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active'
				&& index.includesTag(application, 'COTS Package')
				&& application.relApplicationToITComponent
				&& application.relApplicationToITComponent.nodes.length > 0;
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToITComponent;
			const compliantITComp = subIndex.nodes.find((e) => {
				// access itComponents
				return index.byID[e.id];
			});
			// access itComponents
			return !index.includesTag(compliantITComp ? index.byID[compliantITComp.id] : undefined, 'Placeholder');
		}
	}, {
		name: 'has Description (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.description ? true : false;
		}
	}, {
		name: 'has Lifecycle',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			return Utilities.getCurrentLifecycle(application) ? true : false;
		}
	}, {
		name: 'has IT Owner (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return _hasSubscriptionRole(application, 'IT Owner');
		}
	}, {
		name: 'has SPOC (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return _hasSubscriptionRole(application, 'SPOC');
		}
	}, {
		name: 'has Business Value (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.functionalSuitability ? true : false;
		}
	}, {
		name: 'has Technical Condition (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.technicalSuitability ? true : false;
		}
	}, {
		name: 'has Cost Centre (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'CostCentre') ? true : false;
		}
	}, {
		name: 'Overall Quality',
		overall: true,
		compute: (compliants, nonCompliants, config) => {
			const result = {
				compliant: 0,
				nonCompliant: 0
			};
			for (let key in compliants) {
				result.compliant += compliants[key].length;
				result.nonCompliant += nonCompliants[key].length;
			}
			return result;
		}
	}
];

const _tmp = new Date();
_tmp.setFullYear(_tmp.getFullYear() - 1);
const ONE_YEAR_BEFORE = _tmp.getTime();

function _hasProductionLifecycle(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const currentLifecycle = Utilities.getCurrentLifecycle(application);
	return currentLifecycle && Utilities.isProductionPhase(currentLifecycle) && currentLifecycle.startDate > ONE_YEAR_BEFORE;
}

function _isRetiring(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const phase = application.lifecycle.phases.find((e) => {
		return e.phase === 'endOfLife' && e.startDate && Date.parse(e.startDate + ' 00:00:00') > ONE_YEAR_BEFORE;
	});
	return phase !== undefined && phase !== null;
}

const decommissioningRE = /decommissioning/i;

function _isRetiringProjectAttached(index, subIndex) {
	return subIndex.nodes.some((e) => {
		// access projects
		const project = index.byID[e.id];
		return e.relationAttr.projectImpact === 'sunsets' || (project && decommissioningRE.test(project.name));
	});
}

function _hasSubscriptionRole(application, subscriptionRole) {
	const subIndex = application.subscriptions;
	if (!subIndex || subIndex.nodes.length < 1) {
		return false;
	}
	return subIndex.nodes.find((e) => {
		const roles = e.roles;
		return roles && roles.find((e2) => {
			return e2.name === subscriptionRole;
		});
	});
}