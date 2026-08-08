import type { SkillSummary } from '../../types';

const ID = 'Identity and Governance';
const ST = 'Storage';
const CO = 'Compute';
const NW = 'Networking';
const MO = 'Monitoring and Recovery';

export const domainLabels: Record<string, string> = { [ID]: ID, [ST]: ST, [CO]: CO, [NW]: NW, [MO]: MO };

export const skillSummaries: Record<string, SkillSummary> = {
  'Manage Microsoft Entra users and groups': {
    skill: 'Manage Microsoft Entra users and groups',
    bullets: [
      'Group-based licensing assigns a Microsoft 365 license to a security group; all current and future members receive it automatically.',
      'Use dynamic membership rules to add/remove users without manual changes.',
      'Licenses are managed in Microsoft Entra, not at Azure resource or subscription scope.',
      'Role-based access (RBAC) and licensing are separate mechanisms — roles never grant licenses.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/entra/identity/users/licensing-groups-assign',
  },
  'Assign roles at different scopes': {
    skill: 'Assign roles at different scopes',
    bullets: [
      'RBAC scopes form a hierarchy: management group → subscription → resource group → resource.',
      'Permissions are inherited downward; child-scope assignments never grant access at a parent scope.',
      'Deny assignments override allow assignments.',
      'Choose the narrowest scope that covers all required resources (least privilege).',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/scope-overview',
  },
  'Apply and manage tags on resources': {
    skill: 'Apply and manage tags on resources',
    bullets: [
      'Tags are key/value metadata attached to Azure resources, resource groups, and subscriptions.',
      'Tags appear in Cost Management reports and exports for cost grouping by department, project, etc.',
      'Tags do not enforce behavior — use Azure Policy to enforce tag requirements.',
      'Policy can require tags (Deny), add missing tags (Append), or deploy missing tags (Modify).',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources-portal',
  },
  'Manage external users': {
    skill: 'Manage external users',
    bullets: [
      'B2B collaboration invites external users as guests using their own corporate identities.',
      'No new username/password is created for the guest; you control their access.',
      'Guest access can be scoped (e.g., to specific apps/sites) and revoked or expired.',
      'B2B is identity-level; it is not a substitute for data access mechanisms like SAS tokens.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/entra/external-id/what-is-b2b',
  },
  'Implement and manage Azure Policy': {
    skill: 'Implement and manage Azure Policy',
    bullets: [
      'Policy definitions evaluate resource properties; effects include Deny, Audit, Append, Modify, DeployIfNotExists.',
      'Assignments target scopes: management groups, subscriptions, resource groups.',
      'DeployIfNotExists requires a remediation task (with a managed identity) to fix existing resources.',
      'Initiatives group multiple definitions; policy compliance is reported per assignment.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
  },
  'Configure resource locks': {
    skill: 'Configure resource locks',
    bullets: [
      'CanNotDelete: prevents deletion but allows configuration changes.',
      'ReadOnly: prevents deletion AND configuration changes (acts like a deny for writes).',
      'Locks apply to the scope and all child scopes; they are inherited.',
      'Locks protect against accidental deletion/modification; they are not access control for users.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources',
  },
  'Configure management groups': {
    skill: 'Configure management groups',
    bullets: [
      'Management groups organize subscriptions into a hierarchy for governance.',
      'Policies and RBAC assignments at a management group are inherited by all subscriptions below it.',
      'New subscriptions placed under a management group automatically inherit its governance.',
      'The root management group is the top level; Microsoft recommends exactly one root.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/governance/management-groups/overview',
  },
  'Manage costs by using alerts, budgets': {
    skill: 'Manage costs by using alerts, budgets',
    bullets: [
      'Budgets define a spend limit with alert thresholds (actual or forecast).',
      'Forecast alerts trigger on projected spend, before the limit is actually reached.',
      'Alerts notify via action groups (email, SMS, webhook, etc.).',
      'Budgets cannot block resource creation — use Azure Policy for enforcement.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/cost-mgt-alerts-monitor-usage-spending',
  },
  'Manage built-in Azure roles': {
    skill: 'Manage built-in Azure roles',
    bullets: [
      'Owner: full access including role assignments.',
      'Contributor: create and manage resources, but cannot grant access.',
      'Reader: view everything, no writes.',
      'Support Request Contributor: open and manage support tickets only.',
      'Specialized roles (VM Contributor, Network Contributor, etc.) grant scoped permissions.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles',
  },
  'Manage access to Azure resources': {
    skill: 'Manage access to Azure resources',
    bullets: [
      'Custom roles are defined with actions, notActions, dataActions, and assignableScopes.',
      'assignableScopes limits where the role can be assigned (MGs, subscriptions, RGs).',
      'Role assignments are additive — they never remove other grants.',
      'Assign roles to security groups when membership should drive permissions.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles',
  },
  'Configure Azure Files': {
    skill: 'Configure Azure Files',
    bullets: [
      'Azure Files offers fully managed SMB and NFS file shares.',
      'Multiple VMs can mount the same SMB share simultaneously.',
      'Access can be scoped with private endpoints, firewall, and AD/Entra authentication.',
      'Azure File Sync can cache shares on on-premises servers.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-introduction',
  },
  'Configure storage tiers': {
    skill: 'Configure storage tiers',
    bullets: [
      'Hot: frequently accessed data, lowest latency, highest storage cost.',
      'Cool: infrequent access (30+ days), lower storage cost, higher access cost.',
      'Archive: rarely accessed data; requires hours of rehydration before read.',
      'Tier selection is per blob; lifecycle management can automate tier transitions.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview',
  },
  'Create and use SAS tokens': {
    skill: 'Create and use SAS tokens',
    bullets: [
      'SAS grants scoped, time-limited access to storage services without sharing the account key.',
      'Service-level SAS is tied to a stored access policy (revocable); account-level SAS is not.',
      'User-delegation SAS is signed with a user identity (Microsoft Entra).',
      'Restrict SAS by permissions (r/w/d/l), resource, IP, protocol, and expiry.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview',
  },
  'Create and configure Azure Storage services': {
    skill: 'Create and configure Azure Storage services',
    bullets: [
      'Blob Storage: unstructured object data accessed over HTTP(S).',
      'Files: SMB/NFS file shares.',
      'Queue: asynchronous message passing between application components.',
      'Table: schema-less NoSQL key-attribute store.',
      'Storage account settings: redundancy, tier, encryption, firewall, private endpoints.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-introduction',
  },
  'Configure Azure Storage redundancy': {
    skill: 'Configure Azure Storage redundancy',
    bullets: [
      'LRS: 3 copies within a single datacenter.',
      'ZRS: 3 copies across availability zones in one region.',
      'GRS: LRS in primary + 3 copies in a paired secondary region (async).',
      'RA-GRS: GRS plus read access to the secondary copy.',
      'Premium accounts support LRS and ZRS only.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy',
  },
  'Configure blob lifecycle management': {
    skill: 'Configure blob lifecycle management',
    bullets: [
      'Lifecycle rules automate tiering and deletion based on age or last-modified date.',
      'Typical flow: Hot → Cool → Archive → delete.',
      'Rules filter by prefix, blob type, or tags.',
      'Lifecycle management affects storage cost, not access control or networking.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview',
  },
  'Manage data using AzCopy': {
    skill: 'Manage data using AzCopy',
    bullets: [
      'AzCopy is the command-line tool for high-performance blob/file transfers.',
      'Supports recursive copy (--recursive), resumable transfers, and parallelization.',
      'Works with SAS tokens or Microsoft Entra authentication.',
      'Also supports sync between directories/containers.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10',
  },
  'Configure stored access policies': {
    skill: 'Configure stored access policies',
    bullets: [
      'A stored access policy defines permissions and validity for service-level SAS tokens.',
      'Deleting or modifying the policy revokes all SAS tokens associated with it.',
      'Only service-level SAS can use stored access policies.',
      'Enables immediate revocation without rotating account keys.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/stored-access-policy-configure',
  },
  'Configure object replication': {
    skill: 'Configure object replication',
    bullets: [
      'Object replication asynchronously copies block blobs between accounts (regions).',
      'Prerequisites: blob versioning enabled on source and destination; change feed enabled on source.',
      'Replication policy is set at the container or prefix level.',
      'Useful for latency reduction, compliance, or disaster recovery of blobs.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/blobs/object-replication-overview',
  },
  'Configure storage account encryption': {
    skill: 'Configure storage account encryption',
    bullets: [
      'Azure Storage encrypts all data at rest by default with Microsoft-managed keys.',
      'Customer-managed keys (CMK) store encryption keys in Azure Key Vault.',
      'CMK gives you control over rotation, versioning, and auditing of keys.',
      'The storage account references the key by its URI.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/customer-managed-keys-overview',
  },
  'Provision containers using ACI': {
    skill: 'Provision containers using ACI',
    bullets: [
      'Azure Container Instances runs single containers without VMs or orchestrators.',
      'Good for batch jobs, on-demand workloads, and simple services.',
      'Billing is per second of running time.',
      'Container groups can share resources and a local network.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview',
  },
  'Create an App Service': {
    skill: 'Create an App Service',
    bullets: [
      'App Service is a PaaS for web apps, APIs, and mobile backends.',
      'Microsoft manages the OS, runtime, and patching; platform-managed TLS certs available.',
      'App Service plans define region, size, and instance count (scaling).',
      'Deployment slots, custom domains, and autoscale are built in.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/app-service/overview',
  },
  'Deploy VMs to availability zones': {
    skill: 'Deploy VMs to availability zones',
    bullets: [
      'Availability zones are physically separate datacenters within a region.',
      'Placing VMs in different zones tolerates a complete zone (datacenter) failure.',
      'Availability sets protect against rack and update-fault failures within one datacenter.',
      'Zone-redundant storage and load balancers complement zone-based VM placement.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/availability',
  },
  'Deploy and configure VM Scale Sets': {
    skill: 'Deploy and configure VM Scale Sets',
    bullets: [
      'VMSS runs a group of identical VMs that scale in and out automatically.',
      'Autoscale rules use metrics (e.g., Percentage CPU) with thresholds and durations.',
      'Scale-out and scale-in conditions are configured separately.',
      'Orchestration modes: Uniform (identical instances) and Flexible (VM integration).',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview',
  },
  'Create and manage shared images': {
    skill: 'Create and manage shared images',
    bullets: [
      'Azure Compute Gallery (formerly Shared Image Gallery) distributes VM images.',
      'Structure: gallery → image definition → image version.',
      'Image versions are created from generalized source VMs.',
      'Images can be shared across subscriptions within and across tenants.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/shared-image-galleries',
  },
  'Deploy resources using Bicep files': {
    skill: 'Deploy resources using Bicep files',
    bullets: [
      'Bicep is a domain-specific language for declarative Azure deployments.',
      'param passes inputs at deployment time; var is computed locally; output returns values.',
      'For-loops create multiple resources from arrays without duplicating declarations.',
      'Modules reuse parameterized templates across environments.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview',
  },
  'Create and manage ACR': {
    skill: 'Create and manage ACR',
    bullets: [
      'Azure Container Registry is the private registry for container images.',
      'Colocate ACR with AKS to minimize pull latency.',
      'Supports private endpoints, managed identities, and geo-replication.',
      'Tasks (ACR Tasks) automate image build and push.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/container-registry/container-registry-intro',
  },
  'Configure deployment slots': {
    skill: 'Configure deployment slots',
    bullets: [
      'Slots are separate staging environments in the same App Service plan.',
      'A slot swap redirects production traffic instantly with no cold start.',
      'Validate in staging before swapping; swap-back is trivial after a bad deploy.',
      'Slot-specific settings can be marked as sticky to stay with the slot.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots',
  },
  'Configure App Service scaling': {
    skill: 'Configure App Service scaling',
    bullets: [
      'Instance count lives on the App Service plan, not the app.',
      'Manual scaling changes the instance count directly.',
      'Autoscale rules scale by metric or schedule (time-of-day / day-of-week).',
      'Plan SKUs limit scaling features (e.g., Free/Shared have no autoscale).',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/app-service/manage-scale-up',
  },
  'Move VMs between subscriptions': {
    skill: 'Move VMs between subscriptions',
    bullets: [
      'Cross-subscription moves require both subscriptions in the same Microsoft Entra tenant.',
      'All dependent resources (disks, NICs, VNet, etc.) must be moved together or handled.',
      'Managed disks are supported; some scenarios require moving in a specific order.',
      'Use move with validation first, then execute after validation passes.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/move-resource-group-and-subscription',
  },
  'Map custom DNS to App Service': {
    skill: 'Map custom DNS to App Service',
    bullets: [
      'Custom domains require verifying ownership with a TXT record containing the domain verification ID.',
      'After verification, map with A (IP) or CNAME (hostname) records.',
      'Apex domains use A records (or ALIAS/ANAME); subdomains use CNAME.',
      'TLS for custom domains uses App Service certificates or other cert stores.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain',
  },
  'Create and configure NSGs': {
    skill: 'Create and configure NSGs',
    bullets: [
      'NSGs filter traffic with security rules at subnet or NIC level.',
      'Rules are evaluated by priority number (lower = higher priority); default rules apply last.',
      'Use service tags (Internet, AzureLoadBalancer, etc.) for source/destination.',
      'NSGs are stateful: return traffic is allowed automatically.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview',
  },
  'Configure virtual network peering': {
    skill: 'Configure virtual network peering',
    bullets: [
      'VNet peering connects two VNets over the Microsoft backbone with private IPs.',
      'Peering is not transitive: A-B and B-C do not connect A to C.',
      'Peered VNets in different regions are called global VNet peering.',
      'No gateways are required for peering.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview',
  },
  'Configure VNet peering': {
    skill: 'Configure VNet peering',
    bullets: [
      'VNet peering connects two VNets over the Microsoft backbone with private IPs.',
      'Peering is not transitive: A-B and B-C do not connect A to C.',
      'Create direct peering when transitive routing is required, or use gateway transit.',
      'No VPN gateways or public IPs needed.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview',
  },
  'Configure private endpoints': {
    skill: 'Configure private endpoints',
    bullets: [
      'A private endpoint gives an Azure PaaS service a private IP inside your VNet.',
      'Combined with disabling public access, the private endpoint is the only path to the service.',
      'Private endpoints use Private Link; traffic stays on the Microsoft backbone.',
      'Also used with DNS configuration (private DNS zones) for name resolution.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview',
  },
  'Configure load balancing and traffic routing': {
    skill: 'Configure load balancing and traffic routing',
    bullets: [
      'Azure Load Balancer: L4 TCP/UDP, regional, works with private/public IPs.',
      'Application Gateway: L7 HTTP(S), URL path routing, TLS termination, WAF.',
      'Traffic Manager: DNS-based routing across regions (priority, weighted, performance).',
      'Front Door: global L7, edge caching, WAF, SSL offload.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview',
  },
  'Configure user-defined routes': {
    skill: 'Configure user-defined routes',
    bullets: [
      'Route tables override Azure default routing within a subnet.',
      'A 0.0.0.0/0 route with next hop Virtual Appliance forces internet-bound traffic through an NVA.',
      'Associate the route table with the subnet whose traffic you want to change.',
      'Route priority: user-defined routes beat system routes; longest prefix match wins.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview',
  },
  'Configure load balancer': {
    skill: 'Configure load balancer',
    bullets: [
      'Backend pool contains the VMs receiving traffic.',
      'Health probes determine which backend instances receive traffic.',
      'Load balancing rules map frontend (port/IP) to backend pool and port.',
      'Internal load balancers use private IPs only; public ones expose a public frontend.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview',
  },
  'Configure Azure DNS': {
    skill: 'Configure Azure DNS',
    bullets: [
      'Public zones are authoritative for internet DNS; point the registrar at Azure NS records.',
      'Private zones resolve names inside linked VNets.',
      'Record types: A, AAAA, CNAME, MX, TXT, SRV, PTR, NS, SOA.',
      'Alias records can point to Azure resources and follow their health.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/dns/dns-overview',
  },
  'Evaluate effective security rules': {
    skill: 'Evaluate effective security rules',
    bullets: [
      'Effective rules combine NIC-level and subnet-level NSGs, plus default rules.',
      'Rules are merged and evaluated by priority (lower number first).',
      'Inbound traffic is evaluated against the subnet NSG first, then the NIC NSG.',
      'Use the "Effective security rules" blade to debug blocked traffic.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/network-security-group-how-it-works',
  },
  'Implement Azure Bastion': {
    skill: 'Implement Azure Bastion',
    bullets: [
      'Bastion provides secure RDP/SSH to VMs over TLS, without public IPs.',
      'Requires a dedicated subnet named AzureBastionSubnet with /26 or larger.',
      'Bastion must be in the same VNet as the target VMs.',
      'Access is controlled with RBAC; audit logging is available.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/bastion/bastion-overview',
  },
  'Interpret metrics in Azure Monitor': {
    skill: 'Interpret metrics in Azure Monitor',
    bullets: [
      'Platform metrics (CPU, memory, disk, network) are collected by default for Azure resources.',
      'Azure Monitor Metrics explorer shows metrics with time ranges and aggregations.',
      'Metric alerts trigger on thresholds (static or dynamic).',
      'Metrics are time-series data; logs are textual events.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/data-platform-metrics',
  },
  'Perform backup and restore operations': {
    skill: 'Perform backup and restore operations',
    bullets: [
      'Azure Backup protects VMs, files, databases, and workloads.',
      'Restore options: full VM restore, disk restore, and File Recovery (mount snapshot).',
      'File Recovery mounts the recovery point as a local volume; no VM replacement.',
      'Restores can target a new resource group, region, or alternate location.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/backup/backup-overview',
  },
  'Query and analyze logs': {
    skill: 'Query and analyze logs',
    bullets: [
      'Log Analytics workspaces collect and store log data from multiple sources.',
      'KQL (Kusto Query Language) queries filter, aggregate, and visualize log events.',
      'Common operators: where, project, summarize, count, timeago().',
      'Diagnostic settings route resource logs and activity logs to workspaces.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-query-overview',
  },
  'Create and configure backup policy': {
    skill: 'Create and configure backup policy',
    bullets: [
      'A backup policy defines the schedule (e.g., daily 2 AM) and retention (e.g., 30 days).',
      'Retention rules support daily, weekly, monthly, and yearly retention points.',
      'Recovery Services vaults store recovery points and enable backup/restore operations.',
      'Vault settings: storage redundancy, soft delete, cross-region restore.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/backup/backup-vault-overview',
  },
  'Configure log settings': {
    skill: 'Configure log settings',
    bullets: [
      'Diagnostic settings define what data (metrics/logs) is sent where (workspace, storage, Event Hubs).',
      'Activity Log (subscription-level) and resource logs are streamed via diagnostic settings.',
      'Log categories include administrative, service health, autoscale, policy, and more.',
      'Retention is configured at the destination (e.g., workspace retention policy).',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/diagnostic-settings',
  },
  'Configure Azure Site Recovery': {
    skill: 'Configure Azure Site Recovery',
    bullets: [
      'ASR replicates VMs to a secondary region for disaster recovery.',
      'Replication settings define the target region and recovery network.',
      'Recovery plans sequence failover order and run pre/post-failover scripts.',
      'Planned failover (no data loss) vs unplanned failover (during outage).',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/site-recovery/site-recovery-overview',
  },
  'Set up alert rules': {
    skill: 'Set up alert rules',
    bullets: [
      'Alert rules combine a condition (metric/log threshold) with an action group.',
      'Evaluation frequency controls how often the rule checks the condition.',
      'Action groups define notification channels: email, SMS, push, webhook, ITSM, automation runbook.',
      'For fast SLA notification (e.g., 5 minutes), use a 1-minute evaluation frequency.',
    ],
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview',
  },
};

export const skillDomains: Record<string, string> = {
  'Manage Microsoft Entra users and groups': ID,
  'Assign roles at different scopes': ID,
  'Apply and manage tags on resources': ID,
  'Manage external users': ID,
  'Implement and manage Azure Policy': ID,
  'Configure resource locks': ID,
  'Configure management groups': ID,
  'Manage costs by using alerts, budgets': ID,
  'Manage built-in Azure roles': ID,
  'Manage access to Azure resources': ID,
  'Configure Azure Files': ST,
  'Configure storage tiers': ST,
  'Create and use SAS tokens': ST,
  'Create and configure Azure Storage services': ST,
  'Configure Azure Storage redundancy': ST,
  'Configure blob lifecycle management': ST,
  'Manage data using AzCopy': ST,
  'Configure stored access policies': ST,
  'Configure object replication': ST,
  'Configure storage account encryption': ST,
  'Provision containers using ACI': CO,
  'Create an App Service': CO,
  'Deploy VMs to availability zones': CO,
  'Deploy and configure VM Scale Sets': CO,
  'Create and manage shared images': CO,
  'Deploy resources using Bicep files': CO,
  'Create and manage ACR': CO,
  'Configure deployment slots': CO,
  'Configure App Service scaling': CO,
  'Move VMs between subscriptions': CO,
  'Map custom DNS to App Service': CO,
  'Create and configure NSGs': NW,
  'Configure virtual network peering': NW,
  'Configure private endpoints': NW,
  'Configure load balancing and traffic routing': NW,
  'Configure user-defined routes': NW,
  'Configure load balancer': NW,
  'Configure Azure DNS': NW,
  'Evaluate effective security rules': NW,
  'Configure VNet peering': NW,
  'Implement Azure Bastion': NW,
  'Interpret metrics in Azure Monitor': MO,
  'Perform backup and restore operations': MO,
  'Query and analyze logs': MO,
  'Create and configure backup policy': MO,
  'Configure log settings': MO,
  'Configure Azure Site Recovery': MO,
  'Set up alert rules': MO,
};
