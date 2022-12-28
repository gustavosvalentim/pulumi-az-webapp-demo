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
const appServicePlan = new web.AppServicePlan(getResourceName("appplan"), {
    resourceGroupName: resourceGroup.name,
    kind: "Linux",
    sku: {
        name: "F1",
        tier: "Basic",
    },
}, { parent: resourceGroup, dependsOn: [resourceGroup] });

const appInsights = new insights.Component(getResourceName("insights"), {
    resourceGroupName: resourceGroup.name,
    kind: "web",
    applicationType: insights.ApplicationType.Web
});

// Create App Service
const appServiceName = getResourceName("api");
const appService = new web.WebApp(appServiceName, {
    resourceGroupName: resourceGroup.name,
    serverFarmId: appServicePlan.id,
    httpsOnly: true,
    name: appServiceName,
    siteConfig: {
        healthCheckPath: "/counter",
        nodeVersion: "16-lts",
        appSettings: [
            {
                name: "API_ENVIRONMENT",
                value: "dev"
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
        ]
    },
}, { parent: appServicePlan, dependsOn: [appServicePlan] });

export const AppServiceName = appService.name;
export const WebApp = pulumi.interpolate`https://${appService.defaultHostName}`;