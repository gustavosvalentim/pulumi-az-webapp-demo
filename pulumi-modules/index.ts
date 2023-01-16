import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as web from "@pulumi/azure-native/web";
import * as insights from "@pulumi/azure-native/insights";

const config = new pulumi.Config();
const resourceNamePrefix = config.require("resourceNamePrefix");
const resourceNameSuffix = config.require("resourceNameSuffix");

function getResourceName(name: string) {
  return `${resourceNamePrefix}-${name}-${resourceNameSuffix}`;
}

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup(getResourceName("rg"));

// Create App Service Plan
const appServicePlan = new web.AppServicePlan(
  getResourceName("appplan"),
  {
    resourceGroupName: resourceGroup.name,

    // Pricing
    sku: {
      name: config.require("skuName"),
      tier: config.require("skuTier"),
    },

    // Linux environment
    kind: "linux",
    reserved: true,

    // Scaling
    perSiteScaling: true,
  },
  { parent: resourceGroup, dependsOn: [resourceGroup] }
);

const appInsights = new insights.Component(
  getResourceName("insights"),
  {
    resourceGroupName: resourceGroup.name,
    kind: "web",
    applicationType: insights.ApplicationType.Web,
  },
  { dependsOn: [resourceGroup], parent: resourceGroup }
);

// Create App Service
const appServiceName = getResourceName("api");
const appService = new web.WebApp(
  appServiceName,
  {
    resourceGroupName: resourceGroup.name,
    serverFarmId: appServicePlan.id,
    httpsOnly: true,
    name: appServiceName,
    siteConfig: {
      healthCheckPath: "/health",
      nodeVersion: "16-lts",
      loadBalancing: web.SiteLoadBalancing.WeightedRoundRobin,
      limits: {
        maxPercentageCpu: 90,
      },
      alwaysOn: true,
      httpLoggingEnabled: true,
      detailedErrorLoggingEnabled: true,
      appSettings: [
        {
          name: "API_ENVIRONMENT",
          value: "dev",
        },
        {
          name: "APPINSIGHTS_INSTRUMENTATIONKEY",
          value: appInsights.instrumentationKey,
        },
        {
          name: "APPLICATIONINSIGHTS_CONNECTION_STRING",
          value: pulumi.interpolate`InstrumentationKey=${appInsights.instrumentationKey}`,
        },
        {
          name: "ApplicationInsightsAgent_EXTENSION_VERSION",
          value: "~2",
        },
        {
          name: "SCM_DO_BUILD_DURING_DEPLOYMENT",
          value: "true",
        },
      ],
    },
  },
  { parent: appServicePlan, dependsOn: [appServicePlan] }
);

new insights.AutoscaleSetting(getResourceName("autoscale"), {
  resourceGroupName: resourceGroup.name,
  enabled: true,
  targetResourceUri: appServicePlan.id,
  profiles: [
    {
      rules: [
        {
          metricTrigger: {
            metricName: "CPU Percentage",
            metricNamespace: "Standard metrics",
            metricResourceUri: appServicePlan.id,
            operator: insights.ComparisonOperationType.GreaterThanOrEqual,
            timeAggregation: insights.TimeAggregationType.Average,
            statistic: insights.MetricStatisticType.Average,
            threshold: 70,
            timeGrain: "PT1M",
            timeWindow: "PT5M",
          },
          scaleAction: {
            value: "1",
            type: insights.ScaleType.ChangeCount,
            direction: insights.ScaleDirection.Increase,
            cooldown: "PT5M",
          },
        },
        {
          metricTrigger: {
            metricName: "CPU Percentage",
            metricNamespace: "Standard metrics",
            metricResourceUri: appServicePlan.id,
            operator: insights.ComparisonOperationType.LessThanOrEqual,
            timeAggregation: insights.TimeAggregationType.Average,
            statistic: insights.MetricStatisticType.Average,
            threshold: 50,
            timeGrain: "PT1M",
            timeWindow: "PT5M",
          },
          scaleAction: {
            value: "1",
            type: insights.ScaleType.ChangeCount,
            direction: insights.ScaleDirection.Decrease,
            cooldown: "PT5M",
          },
        },
      ],
      capacity: { default: "1", minimum: "1", maximum: "2" },
      name: "scale 1 instance when cpu usage > 70",
    },
  ],
});

export const WebApp = pulumi.interpolate`https://${appService.defaultHostName}`;
