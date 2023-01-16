# pulumi-az-webapp-demo

## Dependencies

- [Pulumi]()
- [Azure CLI]()
- [NodeJS]()

## Create cloud resources

Create pulumi stack

`pulumi stack init dev`

Preview changes

`pulumi preview`

Create resources in the stack

`pulumi up`

## Deploy

Zip the contents of `src` folder.

Go to your app service at [Azure Portal](https://portal.azure.com) and open advanced tools.

![app service advanced tools option](docs/images/az-portal-advanced-tools.png)

At the advanced tools page navigate to `Tools` > `Zip Push Deploy`.

![tools - zip push deploy](docs/images/az-webapp-zip-deploy-option.png)

Just drag the file and drop at the web page.

> After a few tests I noticed zip deploy only works if I add `SCM_DO_BUILD_DURING_DEPLOYMENT` to the web app settings. This kinds of settings can be found [here](https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet#build-automation)

```javascript
const appService = new web.WebApp(..., {
    ...
    appSettings: {
        {
            name: "SCM_DO_BUILD_DURING_DEPLOYMENT",
            value: "true",
        },
    };
});
```

[Azure - deploy zip](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip?tabs=cli)

[Pulumi example appservice](https://www.pulumi.com/registry/packages/azure-native/how-to-guides/azure-ts-appservice/)

## Linux environment

To use linux as OS instead of windows, which is default.

```typescript
const appServicePlan = new web.AppServicePlan(..., {
    ...
    kind: 'linux',
    reserved: true,
});
```

[Pulumi Docs - App Service Plan](https://www.pulumi.com/registry/packages/azure-native/api-docs/web/appserviceplan/#reserved_nodejs)

[Pulumi Examples - Azure CS Functions](https://github.com/pulumi/examples/blob/master/azure-cs-functions/FunctionsStack.cs#L27)

## Resources location

By default, resources will be created in `brazilsouth` location, run `pulumi config set azure-native:location <region>` to change it.

Obtain a list of available locations `az account list-locations --query "[].name"`.

## Autoscale

Azure App Service Plan can scale out (horizontally) based on metrics and schedule.

- Metrics from App Service Plan can be used trigger actions that increase or decrease the number of VMs instances. More on metrics [here](https://learn.microsoft.com/en-us/azure/app-service/web-sites-monitor)
- Schedule autoscale to run on a specific date by setting the start and end date or a recurrence.

[Get started with autoscale in Azure](https://learn.microsoft.com/en-us/azure/azure-monitor/autoscale/autoscale-get-started)

[Understand autoscale settings](https://learn.microsoft.com/en-us/azure/azure-monitor/autoscale/autoscale-understanding-settings)

[Autoscaling best practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/auto-scaling)

[Pulumi Docs - Insights AutoscaleSetting](https://www.pulumi.com/registry/packages/azure-native/api-docs/insights/autoscalesetting/)
