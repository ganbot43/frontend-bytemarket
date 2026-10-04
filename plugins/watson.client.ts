export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  const integrationId = config.public.watsonIntegrationId as string | undefined
  const serviceInstanceId = config.public.watsonServiceInstanceId as string | undefined
  const region = (config.public.watsonRegion as string | undefined) || "us-south"
  
  const route = useRoute()
  if (route.path.startsWith('/admin')) {
    return // No cargar Watson en el panel de administrador
  }

  if (integrationId && serviceInstanceId) {
    (window as any).watsonAssistantChatOptions = {
      integrationID: integrationId,
      region: region,
      serviceInstanceID: serviceInstanceId,
      onLoad: async (instance: any) => { await instance.render(); }
    };
    
    setTimeout(function(){
      const t = document.createElement('script');
      t.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + 
              ((window as any).watsonAssistantChatOptions.clientVersion || 'latest') + 
              "/WatsonAssistantChatEntry.js";
      document.head.appendChild(t);
    });
  }
})
